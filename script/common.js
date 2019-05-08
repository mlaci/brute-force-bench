const {spawnSync} = require("child_process")
const {totalmem} = require("os")

function hashcatInfo(){
  var {stdout} = spawnSync("hashcat", ["--opencl-info"])
  return stdout.toString()
}
function nvidiaInfo(){
  var {stdout} = spawnSync("nvidia-smi", ["-q"])
  return [...stdout.toString().matchAll(/Product Name.*\n/g)].map((match, i)=>"i. "+match[0]).join()
}
function gpuMemory(){
  var {stdout} = spawnSync("nvidia-smi", ["-q"])
  return Number(stdout.toString().match(/FB Memory Usage\n.*Total.*: (?<n>[0-9]+) MiB/).groups.n)
}

const memoryMax = 512*1024 //kiB
const memorySizes = [...Array(Math.log2(memoryMax)+1)].map((_,i)=>2**i).slice(3)

module.exports = {hashcatInfo, nvidiaInfo, systemMemory: totalmem, gpuMemory, memorySizes}