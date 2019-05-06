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

function clInfo(){
  var {stdout} = spawnSync("clinfo", ["--list"])
  return stdout.toString()
}
console.log(clInfo())

var costs = []

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

//gpu memory
function nvidiaMemory(){
  var {stdout} = spawnSync("nvidia-smi", ["-q"])
  return Number(stdout.toString().match(/FB Memory Usage\n.*Total.*: (?<n>[0-9]+) MiB/).groups.n)
}

const gpuMemory = nvidiaMemory()
const gpuMemories = [...Array(Math.ceil(Math.log2(gpuMemory)))].map((_,i)=>2**i).slice(0,10)

//hashcat bench gpu
Object.entries(hashTypes).forEach(([hashName, hashType])=>{
  if(hashType==hashTypes.pbkdf2){
    var iterations = [1*10**3, 2*10**3, 5*10**3, 1*10**4, 2*10**4, 5*10**4, 1*10**5, 2*10**5, 5*10**5, 1*10**6]
    iterations.forEach(iteration=>{
      var speed = hashcat(hashType, iteration)
      var [it, s] = [iteration, speed.toFixed(6)].map(String)
      console.log(`pbkdf2-sha256-gpu -it ${it.padStart(6)}:\t${s.padStart(10)} H/s`)
      costs = costs.concat([{name: `pbkdf2-sha256-gpu-${iteration}`, iteration, speed}])
    })
  }
  else if(hashType==hashTypes.scrypt){
    gpuMemories.forEach(memory=>{
      var speed = hashcat(hashType, memory*1024, 1, 1)
      var [m, s] = [memory, speed.toFixed(6)].map(String)
      console.log(`scrypt-gpu -m ${m.padStart(4)} MiB:\t${s.padStart(10)} H/s`)
      costs = costs.concat([{name: `scrypt-gpu-1-${m}`, memory, speed}])
    })
  }
  else{
    var speed = hashcat(hashType)
    var s = speed.toFixed(6)
    console.log(`${hashName}-gpu:\t${s.padStart(10)} H/s`)
    costs = costs.concat([{name: `${hashName}-gpu`, speed}])
  }
})

console.log(JSON.stringify(costs))