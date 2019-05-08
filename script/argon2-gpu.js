const {spawnSync} = require("child_process")
const {memorySizes} = require("./common")

function argon2Gpu({mode, time = 1, memory, parallelism = 1, batchSize, samples} = {}){

  var args = ["--output-type", "ns-per-hash", "--output-mode", "mean", "--type", "d",
    "--mode", mode,
    "--t-cost", time,
    "--m-cost", memory,
    "--lanes", parallelism,
    "--batch-size", batchSize,
    "--samples", samples
  ]
  var {stdout, error} = spawnSync("argon2-gpu-bench", args)
  
  if(error){
    console.log(`argon2-gpu-bench ${args}: ${error}`)
    return 0
  }
  else{
    return 1 / (Number(stdout.toString()) / 10**9) // s/H
  }

}

function argon2GpuBench(mode, memTotal){
  const columnSizes = [25, 15, 20]
  console.log(["name","memory (kiB)","speed (H/s)"].map((head,i)=>head.padEnd(columnSizes[i])).join("|"))
  return memorySizes.flatMap(memory=>{
      var batchSize = mode=="cuda" && 2*Math.floor(memTotal/memory) || 10*2**19/memory
      var speed = argon2Gpu({mode, memory, batchSize, samples: 10})
      var name = `argon2-cpu-${memory}`
      var values = [name, `${memory}`, speed.toFixed(6)]
      console.log(values.map((v,i)=>v.padStart(columnSizes[i])).join("|"))
      return [{name, memory, speed}]
  })
}

module.exports = {argon2GpuBench}