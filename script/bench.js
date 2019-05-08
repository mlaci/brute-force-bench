const {hashcatInfo, nvidiaInfo, systemMemory, gpuMemory} = require("./common")
const {hashcatBench} = require("./hashcat")
const {argon2GpuBench} = require("./argon2-gpu")

const tag = process.env.BRUTE_FORCE_BENCH

console.log("BRUTE_FORCE_BENCH="+tag)

var costs = []

if(tag == "opencl-cpu"){
  const memTotal = systemMemory()
  console.log(`System Memory: ${memTotal}`)
  console.log(hashcatInfo())
  costs = costs.concat(hashcatBench("cpu"))
  costs = costs.concat(argon2GpuBench("cpu", memTotal))
}
else if(tag == "opencl-gpu"){
  const memTotal = gpuMemory()
  console.log(`Gpu Memory: ${memTotal}`)
  console.log(hashcatInfo())
  costs = costs.concat(hashcatBench("gpu"))
}
else if(tag == "cuda-gpu"){
  const memTotal = gpuMemory()
  console.log(`Gpu Memory: ${memTotal}`)
  console.log(nvidiaInfo())
  costs = costs.concat(argon2GpuBench("cuda", memTotal))
}

console.log("[\n"+costs.map(cost=>"  "+JSON.stringify(cost)).join(",\n")+"\n]")