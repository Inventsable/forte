<template>
  <div class="main-wrapper full-height">
    <div v-if="device" class="main-wrapper">
      <div class="piano-anno">{{device.name}}</div>
      <chopin ref="piano" />
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
    synth: null,
    context: null,
  }),
  components: {
    // piano: require("./piano.vue").default,
    chopin: require('./chopin.vue').default
  },
  async mounted() {
    this.launchWebAPI();
    // await Tone.start()
        //create a synth and connect it to the master output (your speakers)
    // this.synth = new Tone.Synth().toMaster();
    this.context = new AudioContext();
    this.synth = this.context.createOscillator();
    // o.frequency.setTargetAtTime(440, context.currentTime, 0);
    // o.connect(context.destination);
    // o.start(0);
    this.playKey([0, 60, 0])
  },
  methods: {
    playKey(data) {
      let m = data[1]
      this.synth.frequency.setTargetAtTime(Math.pow(2, (m-69)/12)*440, this.context.currentTime, 0);
    },  
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
      for (var input of midiAccess.inputs.values()) {
        count++;
        if (count == 1) this.device = input;
        input.onmidimessage = function(message) {
          console.log(message)
          if (self.device && (message.data[0] == 144 || message.data[0] == 128))
            self.handleKey(message.data)
        };
      }
    },
    onMIDISuccess(midiAccess) {
      this.listenForKeys(midiAccess);
      midiAccess.onstatechange = e => {
        if (e.port.state !== 'disconnected') 
          this.listenForKeys(midiAccess)
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
