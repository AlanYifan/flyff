/**
 * @file ExtractIcon.cs
 * @description 从 exe 中提取 RT_GROUP_ICON 资源并保存为标准 .ico 文件
 * @generated 2026-07-03
 *
 * 用法：ExtractIcon.exe <源exe路径> <输出ico路径>
 */

using System;
using System.IO;
using System.Runtime.InteropServices;

namespace IconExtractor
{
    /// <summary>
    /// 从 Windows PE 文件中提取图标组资源，重建为标准 .ico 文件。
    /// </summary>
    class Program
    {
        [DllImport("kernel32.dll", SetLastError = true)]
        static extern IntPtr LoadLibraryEx(string lpFileName, IntPtr hFile, uint dwFlags);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool EnumResourceNames(IntPtr hModule, uint lpszType, EnumResNameProc lpEnumFunc, IntPtr lParam);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern IntPtr FindResource(IntPtr hModule, IntPtr lpName, uint lpType);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern IntPtr LoadResource(IntPtr hModule, IntPtr hResInfo);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern IntPtr LockResource(IntPtr hResData);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern uint SizeofResource(IntPtr hModule, IntPtr hResInfo);

        [DllImport("kernel32.dll", SetLastError = true)]
        static extern bool FreeLibrary(IntPtr hModule);

        delegate bool EnumResNameProc(IntPtr hModule, uint lpType, IntPtr lpName, IntPtr lParam);

        const uint LOAD_LIBRARY_AS_DATAFILE = 0x00000002;
        const uint RT_ICON = 3;
        const uint RT_GROUP_ICON = 14;

        static IntPtr g_hModule = IntPtr.Zero;
        static byte[] g_groupData = null;

        /// <summary>
        /// 主入口：提取图标并保存为 ICO 文件。
        /// </summary>
        static void Main(string[] args)
        {
            if (args.Length < 2)
            {
                Console.WriteLine("用法: ExtractIcon.exe <源exe路径> <输出ico路径>");
                return;
            }

            string sourceExe = args[0];
            string outputIco = args[1];

            IntPtr hModule = LoadLibraryEx(sourceExe, IntPtr.Zero, LOAD_LIBRARY_AS_DATAFILE);
            if (hModule == IntPtr.Zero)
            {
                Console.WriteLine("错误: 无法加载 " + sourceExe);
                return;
            }

            g_hModule = hModule;
            g_groupData = null;

            EnumResNameProc callback = (hMod, type, name, param) =>
            {
                IntPtr hRes = FindResource(hMod, name, RT_GROUP_ICON);
                if (hRes != IntPtr.Zero)
                {
                    IntPtr hLoaded = LoadResource(hMod, hRes);
                    IntPtr pData = LockResource(hLoaded);
                    uint size = SizeofResource(hMod, hRes);
                    byte[] buffer = new byte[size];
                    Marshal.Copy(pData, buffer, 0, (int)size);
                    g_groupData = buffer;
                }
                return false;
            };

            EnumResourceNames(hModule, RT_GROUP_ICON, callback, IntPtr.Zero);
            FreeLibrary(hModule);

            if (g_groupData == null)
            {
                Console.WriteLine("错误: 未找到图标组资源");
                return;
            }

            // 解析 GRPICONDIR 结构并重建 ICO 文件
            // GRPICONDIR: reserved(2) + type(2) + count(2) = 6 bytes header
            // Each entry: width(1) + height(1) + colors(1) + reserved(1) + planes(2) + bitcount(2) + bytesInRes(4) + iconID(2) = 16 bytes
            ushort count = BitConverter.ToUInt16(g_groupData, 4);
            int entrySize = 16;

            using (FileStream fs = new FileStream(outputIco, FileMode.Create))
            using (BinaryWriter bw = new BinaryWriter(fs))
            {
                // 写 ICO 头
                bw.Write((ushort)0);        // reserved
                bw.Write((ushort)1);        // type = icon
                bw.Write(count);            // count

                // 先写目录条目，记录每个 RT_ICON 的偏移
                int dataOffset = 6 + count * 16;
                int[] offsets = new int[count];
                int[] sizes = new int[count];

                for (int i = 0; i < count; i++)
                {
                    int baseOffset = 6 + i * entrySize;
                    byte width = g_groupData[baseOffset];
                    byte height = g_groupData[baseOffset + 1];
                    byte colors = g_groupData[baseOffset + 2];
                    byte reserved = g_groupData[baseOffset + 3];
                    ushort planes = BitConverter.ToUInt16(g_groupData, baseOffset + 4);
                    ushort bitCount = BitConverter.ToUInt16(g_groupData, baseOffset + 6);
                    uint bytesInRes = BitConverter.ToUInt32(g_groupData, baseOffset + 8);
                    ushort iconID = BitConverter.ToUInt16(g_groupData, baseOffset + 12);

                    // 从 exe 中提取对应的 RT_ICON
                    IntPtr hRes = FindResource(hModule, (IntPtr)iconID, RT_ICON);
                    // 注意：hModule 已被 FreeLibrary 释放，需要重新加载
                    sizes[i] = (int)bytesInRes;
                    offsets[i] = dataOffset;

                    // ICO 目录条目（256 尺寸用 0 表示）
                    bw.Write(width);
                    bw.Write(height);
                    bw.Write(colors);
                    bw.Write(reserved);
                    bw.Write(planes);
                    bw.Write(bitCount);
                    bw.Write(bytesInRes);
                    bw.Write((uint)dataOffset);

                    dataOffset += (int)bytesInRes;
                }

                // 重新加载模块提取 RT_ICON 数据
                IntPtr hModule2 = LoadLibraryEx(sourceExe, IntPtr.Zero, LOAD_LIBRARY_AS_DATAFILE);
                for (int i = 0; i < count; i++)
                {
                    int baseOffset = 6 + i * entrySize;
                    ushort iconID = BitConverter.ToUInt16(g_groupData, baseOffset + 12);

                    IntPtr hRes = FindResource(hModule2, (IntPtr)iconID, RT_ICON);
                    if (hRes != IntPtr.Zero)
                    {
                        IntPtr hLoaded = LoadResource(hModule2, hRes);
                        IntPtr pData = LockResource(hLoaded);
                        uint size = SizeofResource(hModule2, hRes);
                        byte[] buffer = new byte[size];
                        Marshal.Copy(pData, buffer, 0, (int)size);
                        bw.Write(buffer);
                    }
                }
                FreeLibrary(hModule2);
            }

            Console.WriteLine("成功: ICO 文件已保存到 " + outputIco);
            Console.WriteLine("图标数量: " + count);
        }
    }
}
