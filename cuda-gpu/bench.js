const {spawnSync} = require("child_process")
const {randomFillSync} = require("crypto")

//input generation
function randomBase64(length){
  var arrayBuffer = new Uint8Array(length/8 || 6)
  randomFillSync(arrayBuffer)
  return Buffer.from(arrayBuffer).toString('base64')
}
function RandomHex(length){
  var arrayBuffer = new Uint8Array(length/8 || 32)
  randomFillSync(arrayBuffer)
  return Buffer.from(arrayBuffer).toString('hex')
}
function RandomString(length){
  var arrayBuffer = new Uint8Array(200)
  randomFillSync(arrayBuffer)
  return Buffer.from(arrayBuffer).toString('hex').slice(0,length)
}

function nvidiaInfo(){
  var {stdout} = spawnSync("nvidia-smi", ["-q"])
  return stdout.toString().matchAll(/Product Name.*\n/g).map((match, i)=>"i. "+match[0]).join()
}
console.log(nvidiaInfo())

var costs = []

//gpu memory
function nvidiaMemory(){
  var {stdout} = spawnSync("nvidia-smi", ["-q"])
  return Number(stdout.toString().match(/FB Memory Usage\n.*Total.*: (?<n>[0-9]+) MiB/).groups.n)
}

//benchmarking with argon2-gpu
function argon2Gpu({time = 1, memory, parallelism = 1, batchSize, samples} = {}){

  var args = ["--output-type", "ns-per-hash", "--output-mode", "mean", "--type", "d",
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

const gpuMemory = nvidiaMemory()
const gpuMemories = [...Array(Math.ceil(Math.log2(gpuMemory)))].map((_,i)=>2**i).slice(0,11)

//argon2-gpu-bench
gpuMemories.forEach(memory=>{
  const batchMax = Math.floor(gpuMemory/memory)
  const batchSizes = [batchMax/32, batchMax/8, batchMax/2, batchMax].map(Math.floor).map(n=>n||1)
  batchSizes.forEach(batchSize=>{
    var speed = argon2Gpu({memory, batchSize, samples: 20})
    var [b, m, s] = [batchSize, memory, speed.toFixed(6)].map(String)
    console.log(`argon2-gpu -b ${p.padStart(6)} -m ${m.padStart(4)} MiB:\t${s.padStart(10)} H/s`)
    costs = costs.concat([{name: `argon2-gpu-${b}-${m}`, memory, speed: speed*batchSize}])
  })
})

console.log(JSON.stringify(costs))