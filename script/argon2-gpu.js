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
  const columnSizes = [20, 10, 12, 20]
  console.log(["name","batchSize","memory (kiB)","speed (H/s)"].map((head,i)=>head.padEnd(columnSizes[i])).join("|"))

  return memorySizes.flatMap(memory=>{
    const batchMax = Math.floor(memTotal/memory)
    const batchSizes = [0.1, 0.25, 0.5, 0.75, 0.9, 0.98].map(n=>Math.ceil(batchMax*n))
    return batchSizes.map(batchSize=>{
      var speed = argon2Gpu({mode, memory, batchSize, samples: 10})
      var memoryUsage = Number(batchSize/batchMax.toFixed(2))
      var name = `argon2-${mode}-${memoryUsage}-${memory}`
      var values = [name, `${memoryUsage}`, `${memory}`, speed.toFixed(6)]
      console.log(values.map((v,i)=>v.padStart(columnSizes[i])).join("|"))
      return {name, memoryUsage, memory, speed}
    })
  })
}

module.exports = {argon2GpuBench}