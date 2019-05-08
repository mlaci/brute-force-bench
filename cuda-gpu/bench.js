const {spawnSync} = require("child_process")

//gpu
function nvidiaInfo(){
  var {stdout} = spawnSync("nvidia-smi", ["-q"])
  return [...stdout.toString().matchAll(/Product Name.*\n/g)].map((match, i)=>"i. "+match[0]).join()
}

//gpu memory
function nvidiaMemory(){
  var {stdout} = spawnSync("nvidia-smi", ["-q"])
  return Number(stdout.toString().match(/FB Memory Usage\n.*Total.*: (?<n>[0-9]+) MiB/).groups.n)
}
const gpuMemory = nvidiaMemory()

//benchmarking with argon2-gpu
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

var costs = []

const memoryMax = 512*1024 //kiB
const memorySizes = [...Array(Math.log2(memoryMax)+1)].map((_,i)=>2**i).slice(3)

//argon2-gpu benchmark on cuda
console.log(nvidiaInfo())
console.log(`GPU Memory: ${gpuMemory}`)

const columnSizes = [20, 10, 12, 20]
console.log(["name","batchSize","memory (kiB)","speed (H/s)"].map((head,i)=>head.padEnd(columnSizes[i])).join("|"))

memorySizes.forEach(memory=>{
  const batchMax = Math.floor(gpuMemory/memory)
  const batchSizes = [0.1, 0.25, 0.5, 0.75, 0.9, 0.98].map(n=>Math.ceil(batchMax*n))
  batchSizes.forEach(batchSize=>{
    var speed = argon2Gpu({mode: "cuda", memory, batchSize, samples: 10})
    var memoryUsage = Number(batchSize/batchMax.toFixed(2))
    var name = `argon2-gpu-${memoryUsage}-${memory}`
    var values = [name, `${memoryUsage}`, `${memory}`, speed.toFixed(6)]
    console.log(values.map((v,i)=>v.padStart(columnSizes[i])).join("|"))
    costs = costs.concat([{name, memoryUsage, memory, speed}])
  })
})

console.log("[\n"+costs.map(cost=>"  "+JSON.stringify(cost)).join(",\n")+"\n]")