/**
 * @file FLYFFLauncher.cs
 * @description FLYFF 开发服务器启动器 - 双击 exe 自动启动 Vite 开发服务器
 * @generated 2026-07-03
 *
 * 功能：
 *   1. 自动检测 exe 所在目录作为项目根目录
 *   2. 检测 node_modules 是否存在，缺失则自动 npm install
 *   3. 启动 npm run dev（Vite 开发服务器）
 *   4. UTF-8 控制台输出，友好的彩色界面
 *
 * 编译方式：
 *   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /out:FLYFF-Launcher.exe /target:exe /optimize+ FLYFFLauncher.cs
 */

using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;

namespace FLYFF
{
    /// <summary>
    /// FLYFF 开发服务器启动器主程序。
    /// 自动检测项目目录并启动 Vite 开发服务器。
    /// </summary>
    class Launcher
    {
        /// <summary>设置控制台输出代码页（用于 UTF-8 中文显示）</summary>
        [DllImport("kernel32.dll")]
        static extern bool SetConsoleOutputCP(uint wCodePageID);

        /// <summary>设置控制台输入代码页</summary>
        [DllImport("kernel32.dll")]
        static extern bool SetConsoleCP(uint wCodePageID);

        /// <summary>
        /// 程序入口：检测环境并启动 Vite 开发服务器。
        /// </summary>
        static void Main()
        {
            // 设置 UTF-8 编码以支持中文输出
            SetConsoleOutputCP(65001);
            SetConsoleCP(65001);

            // 获取 exe 所在目录作为项目根目录
            string projectDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');

            Console.Title = "FLYFF 开发服务器启动器";

            // 打印横幅
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine();
            Console.WriteLine("  ╔════════════════════════════════════════════╗");
            Console.WriteLine("  ║          FLYFF 开发服务器启动器            ║");
            Console.WriteLine("  ╚════════════════════════════════════════════╝");
            Console.ResetColor();
            Console.WriteLine();
            Console.WriteLine("  项目路径: " + projectDir);
            Console.WriteLine();

            // 校验：exe 必须放在项目根目录（与 package.json 同级）
            if (!File.Exists(Path.Combine(projectDir, "package.json")))
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("  [错误] 未找到 package.json");
                Console.WriteLine("  请将本启动器放在项目根目录（与 package.json 同级）");
                Console.ResetColor();
                Console.WriteLine("\n  按任意键退出...");
                Console.ReadKey();
                return;
            }

            // 检测 node_modules，缺失则自动安装
            if (!Directory.Exists(Path.Combine(projectDir, "node_modules")))
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("  [提示] 未检测到 node_modules，正在安装依赖...");
                Console.ResetColor();
                Console.WriteLine();

                var installPsi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c npm install",
                    WorkingDirectory = projectDir,
                    UseShellExecute = false,
                    CreateNoWindow = false
                };

                using (var installProcess = Process.Start(installPsi))
                {
                    installProcess.WaitForExit();
                    if (installProcess.ExitCode != 0)
                    {
                        Console.ForegroundColor = ConsoleColor.Red;
                        Console.WriteLine("\n  [错误] 依赖安装失败，请手动运行 npm install");
                        Console.ResetColor();
                        Console.WriteLine("\n  按任意键退出...");
                        Console.ReadKey();
                        return;
                    }
                }

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("\n  [完成] 依赖安装成功！\n");
                Console.ResetColor();
            }

            // 启动 Vite 开发服务器
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("  [启动] 正在启动 Vite 开发服务器...");
            Console.ResetColor();
            Console.WriteLine("  [提示] 按 Ctrl+C 可停止服务器");
            Console.WriteLine("  ────────────────────────────────────────────\n");

            var psi = new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = "/c npm run dev",
                WorkingDirectory = projectDir,
                UseShellExecute = false,
                CreateNoWindow = false
            };

            // 运行并等待退出（Ctrl+C 时进程结束）
            using (var process = Process.Start(psi))
            {
                process.WaitForExit();
            }
        }
    }
}
