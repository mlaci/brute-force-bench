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
    //console.log(`argon2-gpu-bench ${args}: ${error}`)
    return 0
  }
  else{
    return 1 / (Number(stdout.toString()) / 10**9) // s/H
  }

}

function argon2GpuBench(mode, totalMemory){
  const columnSizes = [25, 15, 20, 10]
  console.log(["name","memory (kiB)","speed (H/s)","usage"].map((head,i)=>head.padEnd(columnSizes[i])).join("|"))
  return memorySizes.flatMap(memory=>{
    var batchMax = mode=="cuda" && totalMemory/memory || 20*(1+(19-Math.log2(memory))*128) 
    const memoryUsage = [...new Set([0.01, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99, 1].map(usage=>Math.floor(batchMax*usage)))]
    return memoryUsage.map(batchSize=>{
      var speed = argon2Gpu({mode, batchSize, memory, samples: 10})
      var name = `argon2-${mode}-${memory}`
      var values = [name, `${memory}`, speed.toFixed(6), `${batchSize}`]
      console.log(values.map((v,i)=>v.padStart(columnSizes[i])).join("|"))
      return {name, memory, speed}
    })
  })
}

module.exports = {argon2GpuBench}