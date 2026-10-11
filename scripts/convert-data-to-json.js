/**
 * 数据转换脚本
 * 将大型 JS 数据文件转换为 JSON 格式
 * 
 * 使用方法：
 * node scripts/convert-data-to-json.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT_ROOT = resolve(__dirname, '..')
const SRC_DATA_DIR = resolve(PROJECT_ROOT, 'src/data')
const PUBLIC_DATA_DIR = resolve(PROJECT_ROOT, 'public/data')

// 要转换的文件列表
const FILES_TO_CONVERT = [
  { src: 'ITEM_INFO.js', dest: 'items.json', exportName: 'ITEM_INFO' },
  { src: 'MONSTER_INFO.js', dest: 'monsters.json', exportName: 'MONSTER_INFO' },
  { src: 'SKILL_INFO.js', dest: 'skills.json', exportName: 'SKILL_INFO' }
]

// 确保目标目录存在
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

// 转换单个文件
async function convertFile(srcFile, destFile, exportName) {
  console.log(`\n转换: ${srcFile} -> ${destFile}`)
  
  const srcPath = resolve(SRC_DATA_DIR, srcFile)
  const destPath = resolve(PUBLIC_DATA_DIR, destFile)
  
  try {
    // 动态导入 JS 文件
    const module = await import(`file://${srcPath}`)
    const data = module[exportName] || module.default
    
    if (!data) {
      throw new Error(`无法找到导出变量 ${exportName}`)
    }
    
    console.log(`  数据条目数: ${Object.keys(data).length}`)
    
    // 转换为 JSON 并写入文件
    const startTime = Date.now()
    const jsonStr = JSON.stringify(data)
    writeFileSync(destPath, jsonStr, 'utf-8')
    
    const jsonSize = (jsonStr.length / 1024 / 1024).toFixed(2)
    const elapsed = Date.now() - startTime
    
    console.log(`  输出大小: ${jsonSize} MB`)
    console.log(`  转换耗时: ${elapsed} ms`)
    console.log(`  输出路径: ${destPath}`)
    
    return { success: true, size: jsonStr.length }
  } catch (error) {
    console.error(`  转换失败: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// 主函数
async function main() {
  console.log('========================================')
  console.log('数据文件转换工具')
  console.log('========================================')
  console.log(`源目录: ${SRC_DATA_DIR}`)
  console.log(`目标目录: ${PUBLIC_DATA_DIR}`)
  
  ensureDir(PUBLIC_DATA_DIR)
  
  let totalSize = 0
  let successCount = 0
  
  for (const { src, dest, exportName } of FILES_TO_CONVERT) {
    const result = await convertFile(src, dest, exportName)
    if (result.success) {
      successCount++
      totalSize += result.size
    }
  }
  
  console.log('\n========================================')
  console.log('转换完成')
  console.log(`成功: ${successCount}/${FILES_TO_CONVERT.length}`)
  console.log(`总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log('========================================')
  
  // 输出压缩建议
  console.log('\n提示：')
  console.log('1. 在生产环境中，请确保服务器启用了 gzip 或 brotli 压缩')
  console.log('2. 压缩后文件大小预计可减少 70-80%')
  console.log('3. 可以使用以下命令预压缩文件:')
  console.log('   gzip -k public/data/*.json')
  console.log('   brotli -Z public/data/*.json')
}

main().catch(console.error)
