/**
 * @file FlyFFClient.cs
 * @description FlyFF 客户端启动器 - 仅打开浏览器访问游戏页面
 * @description 不启动服务端，服务端需要单独启动（双击 flyff-server.exe）
 * @description 设计目标：将 dist/ 目录复制给其他玩家，先启动服务端再启动客户端
 * @description 编译方式：csc /out:FlyFFClient.exe /target:exe /optimize+ /win32icon:flyff-client.ico FlyFFClient.cs
 * @generated 2026-07-04
 */

using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Threading;

namespace FLYFF
{
    /// <summary>
    /// FlyFF 客户端启动器主程序。
    /// 仅负责检测服务端是否在线并打开浏览器，不启动服务端。
    /// 使用方式：先双击 flyff-server.exe 启动服务端，再双击 FlyFFClient.exe 打开游戏。
    /// </summary>
    class ClientLauncher
    {
        /// <summary>设置控制台输出代码页（用于 UTF-8 中文显示）</summary>
        [DllImport("kernel32.dll")]
        static extern bool SetConsoleOutputCP(uint wCodePageID);

        /// <summary>设置控制台输入代码页</summary>
        [DllImport("kernel32.dll")]
        static extern bool SetConsoleCP(uint wCodePageID);

        /// <summary>服务端健康检查地址</summary>
        const string ServerUrl = "http://localhost:8080";

        /// <summary>健康检查 API 地址</summary>
        const string HealthCheckUrl = "http://localhost:8080/api/health";

        /// <summary>
        /// 程序入口：检查服务端是否在线，在线则打开浏览器。
        /// 不启动服务端，服务端需要单独启动。
        /// </summary>
        static void Main(string[] args)
        {
            // 设置 UTF-8 编码以支持中文输出
            SetConsoleOutputCP(65001);
            SetConsoleCP(65001);

            // 获取 exe 所在目录（dist 目录）
            string appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');

            Console.Title = "FlyFF Client";

            // 打印横幅
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine();
            Console.WriteLine("  ========================================");
            Console.WriteLine("          FlyFF Client Launcher");
            Console.WriteLine("  ========================================");
            Console.ResetColor();
            Console.WriteLine();

            // ========== 前置检查 ==========

            // 检查 index.html 是否存在（前端页面）
            if (!File.Exists(Path.Combine(appDir, "index.html")))
            {
                PrintError("前端文件 index.html 缺失！");
                PrintError("请确保完整复制 dist 目录的所有文件");
                WaitAndExit();
                return;
            }

            // 检查 flyff-server.exe 是否存在（提示用户先启动服务端）
            if (!File.Exists(Path.Combine(appDir, "flyff-server.exe")))
            {
                PrintError("服务端程序 flyff-server.exe 缺失！");
                PrintError("请确保完整复制 dist 目录的所有文件");
                WaitAndExit();
                return;
            }

            // ========== 检测服务端是否在线 ==========

            PrintInfo("正在检测服务端状态...");
            Console.WriteLine();

            if (!IsServerOnline())
            {
                // 服务端未启动，提示用户先启动
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("  ────────────────────────────────────────────");
                Console.WriteLine("  ⚠  服务端未启动！");
                Console.WriteLine("  ────────────────────────────────────────────");
                Console.ResetColor();
                Console.WriteLine();
                Console.WriteLine("  请先双击 flyff-server.exe 启动服务端，");
                Console.WriteLine("  等待服务端窗口显示「服务已就绪」后，");
                Console.WriteLine("  再双击 FlyFFClient.exe 打开游戏。");
                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.DarkGray;
                Console.WriteLine("  按任意键退出...");
                Console.ResetColor();
                Console.ReadKey();
                return;
            }

            // ========== 服务端在线，打开浏览器 ==========

            PrintSuccess("服务端已在线");
            Console.WriteLine();
            PrintInfo("正在打开浏览器...");
            Console.WriteLine();
            Console.WriteLine("  游戏地址: " + ServerUrl);
            Console.WriteLine();

            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = ServerUrl,
                    UseShellExecute = true
                });
                PrintSuccess("浏览器已打开，祝您游戏愉快！");
            }
            catch (Exception ex)
            {
                PrintError("打开浏览器失败: " + ex.Message);
                PrintInfo("请手动访问: " + ServerUrl);
            }

            Console.WriteLine();
            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.WriteLine("  按任意键关闭此窗口（不影响游戏）");
            Console.ResetColor();
            Console.ReadKey();
        }

        /// <summary>
        /// 检测服务端是否在线（通过健康检查 API）。
        /// 超时时间 3 秒，返回是否成功连接。
        /// </summary>
        /// <returns>服务端在线返回 true，否则返回 false</returns>
        static bool IsServerOnline()
        {
            try
            {
                using (var client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(3);
                    var response = client.GetAsync(HealthCheckUrl).Result;
                    return response.IsSuccessStatusCode;
                }
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// 打印错误信息（红色）。
        /// </summary>
        static void PrintError(string msg)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("  [错误] " + msg);
            Console.ResetColor();
        }

        /// <summary>
        /// 打印提示信息（白色）。
        /// </summary>
        static void PrintInfo(string msg)
        {
            Console.WriteLine("  [√] " + msg);
        }

        /// <summary>
        /// 打印成功信息（绿色）。
        /// </summary>
        static void PrintSuccess(string msg)
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("  [√] " + msg);
            Console.ResetColor();
        }

        /// <summary>
        /// 等待用户按任意键后退出。
        /// </summary>
        static void WaitAndExit()
        {
            Console.WriteLine("\n  按任意键退出...");
            Console.ReadKey();
            Environment.Exit(1);
        }
    }
}
