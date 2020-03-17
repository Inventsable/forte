<template>
  <div>{{fileName}}</div>
</template>

<script>
// const MidiPlayer = require('midi-player-js');
const fs = require('fs')
const path = require('path')
const spy = require('cep-spy').default

export default {
  props: {
    fileName: {
      type: String,
      default: 'ballade1.mid'
    }
  },
  data: () => ({
    Player: null,
  }),
  async mounted() {
    // this.Player = new MidiPlayer.Player(event => {
    //   console.log(event);
    // });
    console.log(spy)

    const file = fs.readFile(`${spy.path.root}/src/assets/ballade1.mid`, (err, data) => {
      if (err) console.error(err)
      else console.log(data)
    })
    // this.Player.loadFile('../assets/ballade1.mid')
    // this.Player.play()
  }
}
</script>

<style>

</style>