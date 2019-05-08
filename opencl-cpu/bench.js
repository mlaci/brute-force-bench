const {totalmem} = require("os")
const {spawnSync} = require("child_process")
const {randomFillSync} = require("crypto")

const vmem = totalmem()

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

function hashcatInfo(){
  var {stdout} = spawnSync("hashcat", ["--opencl-info"])
  return stdout.toString()
}

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

//hashcat codes and hash format
const hashTypes = {
  md5: {code: 0, hash: ()=>RandomHex(128)},
  sha1: {code: 100, hash: ()=>RandomHex(160)}, 
  sha256: {code: 1400, hash: ()=>RandomHex(256)}, 
  bcrypt: {code: 3200, hash: ()=>`$2a$05$${RandomString(53)}`},
  pbkdf2: {code: 10900, hash: (iteration)=>`sha256:${iteration}:${randomBase64()}:${randomBase64(20*8)}`},
  scrypt: {code: 8900, hash: (m,t,p)=>`SCRYPT:${m|1024}:${t|1}:${p|1}:${RandomString(20)}:${RandomString(44)}`},
}

const units = {
  "H/s": 10**0,
  "kH/s": 10**3,
  "MH/s": 10**6,
  "GH/s": 10**9,
  "TH/s": 10**12,
}

//benchmarking with hashcat
function hashcat({code, hash}, arg1, arg2, arg3){

  var args = ["-a", 3, "-O", "-m", code, "--runtime=10", "--status", "--status-timer=1", hash(arg1, arg2, arg3)]
  var {stdout, stderr, error} = spawnSync("hashcat", args)

  if(error){
    console.log(`hashcat ${args}: ${error}`)
    return 0
  }

  try{
    var benches = [...stdout.toString().matchAll(/(?:Speed.#[0-9]+\.*: *[0-9]+(?:\.[0-9]+)? .?H\/s.*\n)+/g)]
    const lastN = 5
    var lastBenches = [...benches.slice(-lastN)].map(bench=>[...bench[0].matchAll(/#[0-9]+\.*: *(?<n>[0-9]+(?:\.[0-9]+)?) (?<unit>.?H\/s)/g)])
    return lastBenches.map(bench=>bench.reduce((sum, {groups:{n, unit}})=>sum + Number(n)*units[unit], 0)).reduce((sum, value)=>sum+value) / lastN
  }
  catch(e){
    console.log(e)
    console.error(stderr.toString())
    return 0
  }
}

var costs = []

const memoryMax = 512*1024 //kiB
const memorySizes = [...Array(Math.log2(memoryMax))].map((_,i)=>2**i).slice(3)

//argon2 cpu bench
console.log(hashcatInfo())
console.log(`Memory: ${vmem}`)

const columnSizes = [20, 10, 12, 20]
console.log(["name","batchSize","memory (kiB)","speed (H/s)"].map((head,i)=>head.padEnd(columnSizes[i])).join("|"))

memorySizes.forEach(memory=>{
  const batchMax = Math.floor(vmem/memory)
  const batchSizes = [0.1, 0.25, 0.5, 0.75, 0.9, 0.98].map(n=>Math.ceil(batchMax*n))
  batchSizes.forEach(batchSize=>{
    var speed = argon2Gpu({mode: "cpu", memory, batchSize, samples: 10})
    var memoryUsage = Number(batchSize/batchMax.toFixed(2))
    var name = `argon2-cpu-${memoryUsage}-${memory}`
    var values = [name, `${memoryUsage}`, `${memory}`, speed.toFixed(6)]
    console.log(values.map((v,i)=>v.padStart(columnSizes[i])).join("|"))
    costs = costs.concat([{name, memoryUsage, memory, speed}])
  })
})

//hashcat cpu bench
Object.entries(hashTypes).forEach(([hashName, hashType])=>{
  if(hashType==hashTypes.pbkdf2){
    var iterations = [1*10**3, 2*10**3, 5*10**3, 1*10**4, 2*10**4, 5*10**4, 1*10**5, 2*10**5, 5*10**5]
    iterations.forEach(iteration=>{
      var speed = hashcat(hashType, iteration)
      var [it, s] = [iteration, speed.toFixed(6)].map(String)
      console.log(`pbkdf2-sha256-cpu -it ${it.padStart(6)}:\t${s.padStart(10)} H/s`)
      costs = costs.concat([{name: `pbkdf2-sha256-cpu-${iteration}`, iteration, speed}])
    })
  }
  else if(hashType==hashTypes.scrypt){
    memorySizes.forEach(memory=>{
      var speed = hashcat(hashType, memory, 8, 1)
      var [p, m, s] = [parallelism, memory, speed.toFixed(6)].map(String)
      console.log(`scrypt-cpu -p ${p.padStart(4)} -m ${m.padStart(4)} MiB:\t${s.padStart(10)} H/s`)
      costs = costs.concat([{name: `scrypt-cpu-${p}-${m}`, memory, speed: speed*parallelism}])
    })
  }
  else{
    var speed = hashcat(hashType)
    var s = speed.toFixed(6)
    console.log(`${hashName}-cpu:\t${s.padStart(10)} H/s`)
    costs = costs.concat([{name: `${hashName}-cpu`, speed}])
  }
})

console.log("[\n"+costs.map(cost=>"  "+JSON.stringify(cost)).join(",\n")+"\n]")