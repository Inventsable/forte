<template>
  <div class="main-wrapper full-height">
    <Menus refresh debug :context="[
        {
          label: 'Clear All',
          callback: clearAll
        }
      ]" 
    />
    <div v-if="device" class="main-wrapper">
      <div class="alt-wrapper">
        <div class="piano-anno">{{device.name}}</div>
        <robot />
      </div>
      <chopin ref="piano" @keyUp="keyUp" @keyDown="keyDown" />
    </div>
    <div v-else class="main-wrapper full-height">
      <div class="piano-anno full-height" style="color: var(--color-scrollbar-arrow);">No device found</div>
    </div>
  </div>
</template>

<script>
import { Menus } from 'lokney'

const xolor = require('xolor');

export default {
  name: "HelloWorld",
  data: () => ({
    text: "Hello",
    device: null,
    context: null,
    outputID: null,
    midiAccess: null,
    keyLength: 88,
    artboardRect: [],
    persistent: false,
    history: {},
    canDraw: true
  }),
  components: {
    // piano: require("./piano.vue").default,
    chopin: require('./chopin.vue').default,
    Menus,
    robot: require('./RoboPlayer.vue').default
  },
  async mounted() {
    this.launchWebAPI();
    this.artboardRect = await this.evalScript('grabArtboardDimensions()');
    console.log(this.artboardRect)
    console.log(this.keyDimensions)

    
  },
  computed: {
    keyDimensions() {
      if (!this.artboardRect.length) return null;
      return {
        width: Math.floor((this.artboardRect[2] / 88)),
        height: this.artboardRect[3] * -1
      };
    }
  },
  methods: {
    clearAll() {
      console.log('CLEARING')
      this.history = {};
      this.evalScript('clearAll()')
    },
    // This should be in a utility! But evalScript is broken in cluecumber
    evalScript(text, defs = {}) {
      if (window.__adobe_cep__)
        return new Promise((resolve, reject) => {
          window.__adobe_cep__.evalScript(`${text}`, res => {
            if (res) resolve(this.isJson(res) ? JSON.parse(res) : res);
            else reject({ error: res });
          });
        });
      else return defs;
    },
    isJson(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    },
    keyUp(data) {
      // this.sendKeyToMIDI(data.index + 21, true)
    },
    keyDown(data) {
      this.sendKeyToMIDI(data.index + 21, false)
    },
    sendKeyToMIDI(key, state) {
      // Note duration needs work. For some reason, using a ternary to press down or up results in note only firing on up event
      // let noteMessage = state ? [144, key, 0x40] : [128, key, 0x40];
      let noteMessage = [144, key, 0x40];
      let output = this.midiAccess.outputs.get(this.outputID);
      output.send(noteMessage)
    },
    // No longer using Tone.js
    // playKey(data) {
    //   let m = data[1]
    //   this.synth.frequency.setTargetAtTime(Math.pow(2, (m-69)/12)*440, this.context.currentTime, 0);
    // },  
    launchWebAPI() {
      if (navigator.requestMIDIAccess) {
        navigator
          .requestMIDIAccess()
          .then(this.onMIDISuccess, this.onMIDIFailure);
      }
    },
    listenForKeys(midiAccess) {
      const self = this;
      let count = 0;
      this.midiAccess = midiAccess;
      for (var output of midiAccess.outputs.values()) 
        this.outputID = output.id || null;
      for (var input of midiAccess.inputs.values()) {
        count++;
        if (count == 1) this.device = input;
        input.onmidimessage = function(message) {
          if (self.device && (message.data[0] == 144 || message.data[0] == 128))
            self.handleKey(message.data)
        };
      }
    },
    onMIDISuccess(midiAccess) {
      this.listenForKeys(midiAccess);
      midiAccess.onstatechange = e => {
        if (e.port.state !== 'disconnected') 
          this.listenForKeys(midiAccess);
        else this.device = null;        
      }
    },
    handleKey(data) {
      data[0] == 144 ? this.keyOn(data) : this.keyOff(data)
    },
    keyOn(data) {
      try {
        this.$refs.piano.setKey(data);
        if (this.canDraw) {
          let fakeKey = this.getKeyData(data);
          this.generateShape(fakeKey);
        }
      } catch(e) {
        // console.log(e)
      }
    },
    keyOff(data) {
      try {
        if (this.canDraw) {
          let name = JSON.parse(JSON.stringify(this.getKeyData(data).name))
          let timecode = JSON.parse(JSON.stringify(this.getKeyData(data).timecode));
          this.$refs.piano.resetKey(data)
          this.deleteShape(name, timecode);
        } else
          this.$refs.piano.resetKey(data)
      } catch(e) {
        // 
      }
    },
    getKeyData(UintArray) {
      let index = UintArray[1] - 21;
      return this.$refs.piano.realKeys[index];
    },
    // 
    deleteShape(name, timecode) {
      // let target = `${name}-${timecode}`
      // console.log(target)
      // this.evalScript(`deleteRectByName('${target}')`)
    },
    // This should accept a JSON for complex pathItems. For now POC with rectangles
    generateShape(key) {
      let check = this.checkHistory(key);
      let dimensions = this.generateKeyDimensions(key, check);
      // console.log(`${dimensions.rect.left}, ${dimensions.rect.top}, ${dimensions.rect.width}, ${dimensions.rect.height}`)
      this.evalScript(`createSimpleRect('${JSON.stringify(dimensions)}')`)
    },
    checkHistory(key) {
      let exists = Object.keys(this.history).find(entry => {
        return entry == key.name
      })
      if (exists) this.history[key.name].push(key.timecode)
      else this.history[key.name] = [key.timecode]
      return this.history[key.name].length - 1;
    },
    generateKeyDimensions(key, historylength) {
      let result = {
        name: `${key.name}-${key.timecode}`,
        color: this.getColor(key, historylength),
        rect: {
          left: key.index * this.keyDimensions.width,
          top: historylength * this.keyDimensions.width * -1,
          width: this.keyDimensions.width,
          height: this.keyDimensions.width,
        },
      }
      result['path'] = [result.rect.left, result.rect.top, result.rect.width, result.rect.height]
      return result;
    },
    getColor(key, historylength) {
      let topColor = xolor('#ff0000'), bottomColor = xolor('#0000ff');
      let xRange = +((key.index + 1) / 88).toFixed(2), yRange = 0;
      let topResult = topColor.gradient('#0000ff', xRange), bottomResult = bottomColor.gradient('#00ffff');
      if (historylength > 1) {
        yRange = +((this.keyDimensions.width / (this.artboardRect[3] * -1)) * historylength).toFixed(2);
      }
      let finalResult = xolor(topResult).gradient(bottomResult, yRange);
      return finalResult.array;
    }
  }
};
</script>

<style >
.main-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.full-height {
  height: 100%;
  display: flex;
  align-items: center;
}

.piano-anno {
  font-size: 16px;
  color: var(--color-default);
  text-transform: uppercase;
  letter-spacing: 0.125ch;
}

.alt-wrapper {
  position: absolute;
  left: 0;
  padding: 0px;
  margin: 0px 10px;
  width: calc(100% - 20px);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
