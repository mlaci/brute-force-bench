const {spawnSync} = require("child_process")
const {randomFillSync} = require("crypto")
const {memorySizes} = require("./common")

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

//hashcat codes and hash format
const hashTypes = {
  md5: {code: 0, hash: ()=>RandomHex(128)},
  sha1: {code: 100, hash: ()=>RandomHex(160)}, 
  sha256: {code: 1400, hash: ()=>RandomHex(256)}, 
  bcrypt: {code: 3200, hash: ()=>`$2a$05$${RandomString(53)}`},
  pbkdf2: {code: 10900, hash: (iteration)=>`sha256:${iteration}:${randomBase64()}:${randomBase64(20*8)}`},
  scrypt: {code: 8900, hash: (m,t,p)=>`SCRYPT:${m|1024}:${t|1}:${p|1}:${RandomString(20)}:${RandomString(44)}`},
}

function hashcat({code, hash}, arg1, arg2, arg3){

  var args = ["-a", 3, "-O", "-m", code, "--runtime=20", "--status", "--status-timer=1", hash(arg1, arg2, arg3)]
  var {stdout, stderr, error} = spawnSync("hashcat", args)

  if(error){
    console.log(`hashcat ${args}: ${error}`)
    return 0
  }

  try{
    var benches = [...stdout.toString().matchAll(/(?:Speed.#[0-9]+\.*: *[0-9]+(?:\.[0-9]+)? .?H\/s.*\n)+/g)]
    const lastN = 10
    var lastBenches = [...benches.slice(-lastN)].map(bench=>[...bench[0].matchAll(/#[0-9]+\.*: *(?<n>[0-9]+(?:\.[0-9]+)?) H\/s/g)])
    return lastBenches.map(bench=>bench.reduce((sum, {groups:{n}})=>sum + Number(n), 0)).reduce((sum, value)=>sum+value) / lastN
  }
  catch(e){
    console.log(e)
    console.error(stderr.toString())
    return 0
  }
}

function hashes(tag){
  const columnSizes = [25, 36]
  console.log(["name","speed (H/s)"].map((head,i)=>head.padEnd(columnSizes[i])).join("|"))
  return ["md5", "sha1", "sha256", "bcrypt"].map(hashName=>{
    var speed = hashcat(hashTypes[hashName])
    var name = `${hashName}-${tag}`
    var values = [name, speed.toFixed(6)]
    console.log(values.map((v,i)=>v.padStart(columnSizes[i])).join("|"))
    return {name, speed}
  })
}

function pbkdf2(tag){
  const columnSizes = [25, 15, 20]
  console.log(["name","iterations", "speed (H/s)"].map((head,i)=>head.padEnd(columnSizes[i])).join("|"))
  var iterations = [1*10**3, 2*10**3, 5*10**3, 1*10**4, 2*10**4, 5*10**4, 1*10**5, 2*10**5, 5*10**5]
  return iterations.map(iteration=>{
    var speed = hashcat(hashTypes.pbkdf2, iteration)
    var name = `pbkdf2-${tag}-${iteration}`
    var values = [name, `${iteration}`, speed.toFixed(6)]
    console.log(values.map((v,i)=>v.padStart(columnSizes[i])).join("|"))
    return {name, iteration, speed}
  })
}

function scrypt(mode){
  const columnSizes = [25, 15, 20]
  console.log(["name","memory (kiB)","speed (H/s)"].map((head,i)=>head.padEnd(columnSizes[i])).join("|"))
  return memorySizes.map(memory=>{
    var speed = hashcat(hashTypes.scrypt, memory, 8, 1)
    var name = `scrypt-${mode}-${memory}`
    var values = [name, `${memory}`, speed.toFixed(6)]
    console.log(values.map((v,i)=>v.padStart(columnSizes[i])).join("|"))
    return {name, memory, speed}
  })
}

function hashcatBench(mode){
  var costs = []
  costs = costs.concat(hashes(mode))
  costs = costs.concat(pbkdf2(mode))
  costs = costs.concat(scrypt(mode))
  return costs
}

module.exports = {hashcatBench}