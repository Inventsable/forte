<template>
  <div class="main-wrapper full-height">
    <div v-if="device" class="main-wrapper">
      <div class="piano-anno">{{device.name}}</div>
      <chopin ref="piano" @keyUp="keyUp" @keyDown="keyDown" />
    </div>
    <div v-else class="main-wrapper full-height">
      <div class="piano-anno full-height" style="color: var(--color-scrollbar-arrow);">No device found</div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  data: () => ({
    text: "Hello",
    device: null,
    context: null,
    outputID: null,
    midiAccess: null,
  }),
  components: {
    // piano: require("./piano.vue").default,
    chopin: require('./chopin.vue').default
  },
  async mounted() {
    this.launchWebAPI();
  },
  methods: {
    keyUp(data) {
      // this.sendKeyToMIDI(data.index + 21, true)
    },
    keyDown(data) {
      this.sendKeyToMIDI(data.index + 21, false)
    },
    sendKeyToMIDI(key, state ) {
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
        this.$refs.piano.setKey(data)
      } catch(e) {
        // 
      }
    },
    keyOff(data) {
      try {
        this.$refs.piano.resetKey(data)
      } catch(e) {
        // 
      }
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
</style>
