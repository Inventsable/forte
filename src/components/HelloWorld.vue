<template>
  <div class="main-wrapper">
    <div class="piano-anno">{{device}}</div>
    <piano ref="piano" />
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  data: () => ({
    text: "Hello",
    device: "Hello"
  }),
  components: {
    piano: require("./piano.vue").default
  },
  mounted() {
    this.launchWebAPI();
  },
  methods: {
    launchWebAPI() {
      if (navigator.requestMIDIAccess) {
        navigator
          .requestMIDIAccess()
          .then(this.onMIDISuccess, this.onMIDIFailure);
      }
    },
    onMIDISuccess(midiAccess) {
      let count = 0;
      const self = this;
      for (var input of midiAccess.inputs.values()) {
        count++;
        if (count == 1) this.device = input.name;
        input.onmidimessage = function(message) {
          if (message.data[0] == 144 || message.data[0] == 128)
            self.handleKey(message.data)
        };
      }
    },
    handleKey(data) {
      data[0] == 144 ? this.keyOn(data) : this.keyOff(data)
    },
    keyOn(data) {
      this.$refs.piano.setKey(data)
    },
    keyOff(data) {
      this.$refs.piano.resetKey(data)
    },
    getMIDIMessage(midiMessage) {
      console.log(midiMessage);
    },
    onMIDIFailure() {
      console.log("Could not access your MIDI devices.");
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

.piano-anno {
  font-size: 16px;
  color: var(--color-default);
  text-transform: uppercase;
  letter-spacing: 0.125ch;
}
</style>
