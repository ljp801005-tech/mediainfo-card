// 解析自检（纯 Node，不需要浏览器）：
//   ① 原始参数名写法（CompleteName / FileSize/String / Format_Version，-f 或原始参数名导出）
//      以前只认得 General 段头，得分停在 5 分（门槛 6），整块「识别份数 0」——这里钉死；
//   ② 普通写法（Complete name / File size）不能被这次改动带坏；
//   ③ deRawNames / deZhNames 必须幂等，且对没有标签的普通文本零改动；
//   ④ 引用框里「引用General」粘在一起；⑤ 中文界面 MediaInfo（全中文标签）。
// 运行：node tests/parse.test.cjs
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'mediainfo-card.user.js');

global.location = { hostname: 'hdwing.org', pathname: '/details.php', search: '?id=1', href: 'https://hdwing.org/details.php?id=1' };
const m = require(SRC);

let fail = 0;
const check = (name, ok, extra) => {
  if (ok) console.log('PASS ' + name);
  else { fail++; console.log('FAIL ' + name + (extra ? ' → ' + extra : '')); }
};

console.log('v' + m.VERSION + ' 解析自检（原始参数名 / 普通写法）');

// ---------- ① 原始参数名（取自 hdwing 上一份实际的贴文，字段顺序与缩进保持原样） ----------
const RAW = `General
UniqueID/String                  : 191795815456384963267507398991638479835 (0x904A87C9938FF7938BCC8414592CC3DB)
CompleteName                     : /media/downloads/movies/外语电影/[异形魔怪4].Tremors.IV.The.Legend.Begins.2004.BluRay.720p.x264.AC3-CMCT.mkv
Format/String                    : Matroska
Format_Version                   : Version 2
FileSize/String                  : 3.20 GiB
Duration/String                  : 1h 40mn
OverallBitRate/String            : 4534 Kbps
FrameRate/String                 : 23.976 fps
Encoded_Date                     : 2015-03-08 12:24:45 UTC
Encoded_Application/String       : mkvmerge v3.4.0 ('Rapunzel') 编译于 May 15 2010 09:38:20
Encoded_Library/String           : libebml v0.8.0 + libmatroska v0.9.0
Attachments                      : hwkaiti.ttf

Video
ID/String                        : 6
Format/String                    : AVC
Format/Info                      : Advanced Video Codec
Format_Profile                   : High@L4.1
Format_Settings                  : CABAC / 8 Ref Frames
Format_Settings_RefFrames/String : 8 frame
CodecID                          : V_MPEG4/ISO/AVC
Duration/String                  : 1h 40mn
BitRate/String                   : 3878 Kbps
Width/String                     : 1280 pixel
Height/String                    : 720 pixel
DisplayAspectRatio/String        : 16:9
FrameRate_Mode/String            : CFR
FrameRate/String                 : 23.976 (24000/1001) fps
ColorSpace                       : YUV
ChromaSubsampling/String         : 4:2:0
BitDepth/String                  : 8 bit
ScanType/String                  : Progressive
Bits-(Pixel*Frame)               : 0.176
StreamSize/String                : 2.68 GiB (84%)
Title                            : 猪猪@CMCT
Encoded_Library/String           : x264 core 138 r2358 9e941d1
Encoded_Library_Settings         : cabac=1 / ref=8 / deblock=1:-3:-3 / analyse=0x3:0x133 / me=umh / subme=11 / trellis=2 / bframes=6 / b_pyramid=2 / direct=1 / weightp=2 / keyint=240 / rc=2pass / mbtree=1 / bitrate=3878
Default/String                   : Yes
Forced/String                    : No

Audio
ID/String                        : 7
Format/String                    : AC-3
Format/Info                      : Audio Coding 3
Format_Commercial_IfAny          : Dolby Digital
CodecID                          : A_AC3
BitRate_Mode/String              : CBR
BitRate/String                   : 640 Kbps
Channel(s)/String                : 6 channel
ChannelLayout                    : L R C LFE Ls Rs
SamplingRate/String              : 48.0 KHz
Compression_Mode/String          : Lossy
StreamSize/String                : 462 MiB (14%)
ServiceKind/String               : Complete Main
dialnorm                         : -31 dB

Text #1
ID/String                        : 1
Format/String                    : ASS
CodecID                          : S_TEXT/ASS
CodecID/Info                     : Advanced Sub Station Alpha
Title                            : 中上英下
Default/String                   : Yes
Forced/String                    : No

Text #2
Format/String                    : ASS
CodecID                          : S_TEXT/ASS
Title                            : 繁体中文
Forced/String                    : No

Text #3
Format/String                    : ASS
CodecID                          : S_TEXT/ASS
Title                            : 英文
Forced/String                    : No
`;

const info = m.parseInfo(RAW);

check('得分过门槛（≥6，旧版只有 5）', m.scoreMediaInfo(RAW) >= 6, String(m.scoreMediaInfo(RAW)));
check('文件名取到 .mkv', /^\[异形魔怪4\].*\.mkv$/.test(info.fileName), info.fileName);
check('体积 3.20 GiB', info.size === '3.20 GiB', info.size);
check('日期 2015-03-08', info.date === '2015-03-08', info.date);
check('时长 1h 40min（mn 也要认）', info.duration === '1h 40min', info.duration);
check('分辨率 1280 x 720 (16:9)', info.resolution === '1280 x 720 (16:9)', info.resolution);
check('帧率取到 23.976', /23\.976/.test(info.fps), info.fps);
check('视频 x264 @ 3878 Kbps', /x264/.test(info.video[0] || '') && /3878 Kbps/.test(info.video[0] || ''), info.video[0]);
check('音频 5.1 @ 640 Kbps', /5\.1/.test(info.audio[0] || '') && /640 Kbps/.test(info.audio[0] || ''), info.audio[0]);
check('字幕 3 条', info.subtitle.length === 3, String(info.subtitle.length));
check('字幕标题保留中文', /中上英下/.test(info.subtitle[0] || ''), info.subtitle[0]);
check('参数取到 x264 命令行关键项', /ref=8/.test(info.params) && /subme=11/.test(info.params), info.params);
// Format/Info 是「Format 的解释行」，不能把 Format 顶成「Advanced Video Codec」
check('Format/Info 不污染视频编码', !/Advanced Video Codec/.test(m.infoToText(info)), info.video[0]);

// ---------- ② 普通写法不能被带坏 ----------
const NORMAL = `General
Complete name                    : D:\\movies\\Test.Movie.2020.1080p.BluRay.x264.mkv
Format                           : Matroska
File size                        : 8.44 GiB
Duration                         : 1 h 52 min
Overall bit rate                 : 10.8 Mb/s
Encoded date                     : UTC 2020-05-01 10:00:00

Video
Format                           : AVC
Width                            : 1 920 pixels
Height                           : 1 080 pixels
Display aspect ratio             : 16:9
Frame rate                       : 23.976 FPS
Bit rate                         : 10 000 kb/s
Encoding settings                : cabac=1 / ref=4 / subme=9
Writing library                  : x264 core 157

Audio
Format                           : AC-3
Channel(s)                       : 6 channels
Sampling rate                    : 48.0 kHz
Bit rate                         : 640 kb/s
Language                         : English

Text
Format                           : UTF-8
Language                         : Chinese
`;
const n = m.parseInfo(NORMAL);
check('普通写法：文件名', n.fileName === 'Test.Movie.2020.1080p.BluRay.x264.mkv', n.fileName);
check('普通写法：体积', n.size === '8.44 GiB', n.size);
check('普通写法：日期', n.date === '2020-05-01', n.date);
check('普通写法：分辨率', n.resolution === '1920 x 1080 (16:9)', n.resolution);
check('普通写法：视频 x264', /x264/.test(n.video[0] || ''), n.video[0]);
check('普通写法：音频 English', /English/.test(n.audio[0] || ''), n.audio[0]);
check('普通写法：文本原样（deRawNames 不动它）', m.deRawNames(m.normalizeText(NORMAL)) === m.normalizeText(NORMAL));

// ---------- ③ deRawNames 幂等 / 不误伤 ----------
const once = m.deRawNames(RAW);
check('幂等：再规范化一次结果不变', m.deRawNames(once) === once);
const ZH = '这是一段普通的中文简介：片名 Tremors 4，导演 Don Michael Paul，时长 100 分钟。';
check('纯中文简介零改动', m.deRawNames(ZH) === ZH);
check('带空格的普通标签零改动', m.deRawNames('File size : 3.20 GiB\nFormat : Matroska') === 'File size : 3.20 GiB\nFormat : Matroska');
check('原始参数名换行后带空格', /^Complete Name\s+:/m.test(once), (once.match(/^Complete.*$/m) || [''])[0]);


// ---------- ④ BDInfo：老格式（列对齐）与 0.8.x ffprobe 简写 ----------
const BD_OLD = `DISC INFO:
Disc Title:     Tremors.3.Back.to.Perfection.2001.CEE.VC-1.DTS-HD.MA.5.1-DiY@HDHome
Disc Size:      34,984,766,626 bytes
Protection:     AACS

PLAYLIST REPORT:

Name:                   00001.MPLS
Length:                 1:43:36.203
Size:                   33,966,520,320 bytes
Total Bitrate:          43.71 Mbps

VIDEO:

Codec                   Bitrate             Description
-----                   -------             -----------
MPEG-4 AVC Video        0 kbps              1080p / 23.976 fps / 16:9 / High Profile 4.1

AUDIO:

Codec                           Language        Bitrate         Description
-----                           --------        -------         -----------
DTS-HD Master Audio             English         0 kbps          5.1 / 48 kHz / 24-bit
`;
const bdOld = m.parseBDInfo(BD_OLD);
check('BDInfo 老格式：碟名', bdOld.discTitle === 'Tremors.3.Back.to.Perfection.2001.CEE.VC-1.DTS-HD.MA.5.1-DiY@HDHome', bdOld.discTitle);
check('BDInfo 老格式：播放列表带加密', /00001\.MPLS/.test(bdOld.playlist) && /AACS/.test(bdOld.playlist), bdOld.playlist);
check('BDInfo 老格式：分辨率 1080p · 16:9', bdOld.resolution === '1080p · 16:9', bdOld.resolution);
check('BDInfo 老格式：视频 H.264', /^H\.264/.test(bdOld.video[0] || ''), bdOld.video[0]);
check('BDInfo 老格式：音频 DTS-HD MA 5.1', /DTS-HD MA 5\.1/.test(bdOld.audio[0] || ''), bdOld.audio[0]);

// BDInfo 0.8.0.1（ffprobe 后端）：没有列对齐，每行用「 / 」串属性；字幕只给总数
const BD_FF = `DISC INFO:
Disc Title:     Tremors.3.Back.to.Perfection.2001.CEE.VC-1.DTS-HD.MA.5.1-DiY@HDHome
Disc Size:      34,984,766,626 bytes
Protection:     AACS
Extras:         BD-Java
BDInfo:         0.8.0.1 (ffprobe)
PLAYLIST REPORT:
Length:         1:43:36.203
Size:           33,966,520,320 bytes
Total Bitrate:  43.71 Mbps
VIDEO:
MPEG-4 AVC Video / 1920x1080 / High
AUDIO:
DTS / 5.1 / 6 channels
DTS-HD MA / 5.1 / 6 channels
DTS / 2.0 / 2 channels
DTS / 2.0 / 2 channels
DTS / 5.1 / 6 channels
DTS / 5.1 / 6 channels
DTS / 5.1 / 6 channels
DTS / 5.1 / 6 channels
DTS / 2.0 / 2 channels
SUBTITLES: PGS × 32
`;
const bdFf = m.parseBDInfo(BD_FF);
check('BDInfo 简写：识别为原盘', m.isBDInfo(BD_FF));
check('BDInfo 简写：碟名', bdFf.discTitle === 'Tremors.3.Back.to.Perfection.2001.CEE.VC-1.DTS-HD.MA.5.1-DiY@HDHome', bdFf.discTitle);
check('BDInfo 简写：体积（正片 / 整盘）', bdFf.size.length === 2 && /31\.63 GiB/.test(bdFf.size[0]) && /32\.58 GiB/.test(bdFf.size[1]), JSON.stringify(bdFf.size));
check('BDInfo 简写：时长', bdFf.duration === '1h 43min 36s', bdFf.duration);
check('BDInfo 简写：总码率', bdFf.bitrate === '43.71 Mbps', bdFf.bitrate);
check('BDInfo 简写：分辨率', bdFf.resolution === '1920x1080', bdFf.resolution);
check('BDInfo 简写：视频 H.264 · High', bdFf.video[0] === 'H.264 · High', bdFf.video[0]);
check('BDInfo 简写：9 条音轨一条不少', bdFf.audio.length === 9, String(bdFf.audio.length));
check('BDInfo 简写：DTS-HD MA 没被并成 DTS', bdFf.audio.filter(x => /^DTS-HD MA 5\.1$/.test(x)).length === 1, bdFf.audio.join(' | '));
check('BDInfo 简写：字幕计数 SUP × 32', bdFf.subtitle.length === 1 && bdFf.subtitle[0] === 'SUP × 32', JSON.stringify(bdFf.subtitle));
check('BDInfo 简写：源里没有帧率就留空', bdFf.fps === '', bdFf.fps);


// ---------- ④ 引用框：<legend>引用</legend>General 把段头和「引用」粘成一行 ----------
// hdwing（HDChina 瓷器）的简介格是 <fieldset><legend>引用</legend>General<br>…，
// textContent 里第一行就是「引用General」。老版本只认裸 General，整块得分停在 5（门槛 6），
// 页面上表现成「识别份数 0」，而 Video / Audio 都在文本里 —— 所以分数差得不多、特别难猜。
const QUOTED = `引用General
Unique ID : 59124128239658281992441393150836407320 (0x2C7AE4952D384CAE8F030561D504FC18)
Format : Matroska
Format version : Version 4
File size : 9.54 GiB
Duration : 1 h 31 min
Overall bit rate : 14.9 Mb/s
Frame rate : 24.000 FPS
Writing application : mkvmerge v97.0 ('You Don't Have A Clue') 64-bit
Writing library : libebml v1.4.5 + libmatroska v1.7.1

Video
ID : 1
Format : HEVC
Format profile : Main@L5@Main
Codec ID : V_MPEGH/ISO/HEVC
Bit rate : 14.5 Mb/s
Width : 3 840 pixels
Height : 2 160 pixels
Display aspect ratio : 16:9
Frame rate : 24.000 FPS
Bit depth : 8 bits
Stream size : 9.25 GiB (97%)

Audio
ID : 2
Format : E-AC-3 JOC
Codec ID : A_EAC3
Bit rate : 448 kb/s
Channel(s) : 6 channels
Sampling rate : 48.0 kHz
Title : English Dolby Digital Plus with Dolby Atmos 5.1
Language : English

Text #1
ID : 3
Format : UTF-8
Codec ID : S_TEXT/UTF8
Title : Simplified Chinese
Language : Chinese (Simplified)
`;
const plainQuoted = QUOTED.replace(/^引用/, '');
check('引用前缀：整块得分过门槛', m.scoreMediaInfo(QUOTED) >= 6, String(m.scoreMediaInfo(QUOTED)));
check('引用前缀：与去掉「引用」后同分', m.scoreMediaInfo(QUOTED) === m.scoreMediaInfo(plainQuoted),
  m.scoreMediaInfo(QUOTED) + ' vs ' + m.scoreMediaInfo(plainQuoted));
const q = m.parseInfo(QUOTED);
check('引用前缀：体积', q.size === '9.54 GiB', q.size);
check('引用前缀：时长', q.duration === '1h 31min', q.duration);
check('引用前缀：分辨率', q.resolution === '3840 x 2160 (16:9)', q.resolution);
check('引用前缀：视频 H.265', /^H\.265/.test(q.video[0] || ''), q.video[0]);
check('引用前缀：音频 DD+ Atmos 5.1', /DD\+ Atmos 5\.1/.test(q.audio[0] || ''), q.audio[0]);
check('引用前缀：字幕 1 条', q.subtitle.length === 1, String(q.subtitle.length));

// ---------- ⑤ 中文界面 MediaInfo（中文版 MediaInfo 直接导出） ----------
// 段头 / 字段名全中文、全角空格对齐、值是「1小时 3 分钟 / 6 声道 / 是 / 否」。
// 老版本一条英文标签都匹配不上，得分 0。这里钉死标签翻译 + 值侧单位还原。
const ZH_MI = `通用
特征　ＩＤ　　　　　　　　　　　　 : 61790229428753115411917046942060521689 (0x2E7C5D8522BC1E8B5E443AA8384C28D9)
完整名称　　　　　　　　　　　　　 : F:\\电视剧\\The.Boys.S05E01.2160p.AMZN.WEB-DL.DV.HDR.H265.DDP5.1.Atmos-BiVerse@ADWeb.mkv
格式　　　　　　　　　　　　　　　 : Matroska
格式版本　　　　　　　　　　　　　 : Version 4
文件大小　　　　　　　　　　　　　 : 6.43 GiB
时长　　　　　　　　　　　　　　　 : 1小时 3 分钟
总体码率　　　　　　　　　　　　　 : 14.4 Mb/s
帧率　　　　　　　　　　　　　　　 : 23.976 FPS
编码日期　　　　　　　　　　　　　 : 2026-05-20 11:16:31 UTC
编码程序　　　　　　　　　　　　　 : mkvmerge 98.0 ('Chonks') 64-bit
编码函数库　　　　　　　　　　　　 : libebml v1.4.5 + libmatroska v1.7.1

视频
ＩＤ　　　　　　　　　　　　　　　 : 1
格式　　　　　　　　　　　　　　　 : HEVC
格式／信息　　　　　　　　　　　　 : High Efficiency Video Coding
格式配置　（Ｐｒｏｆｉｌｅ）　　　 : Main 10@L5@Main
编解码器　ＩＤ　　　　　　　　　　 : V_MPEGH/ISO/HEVC
码率　　　　　　　　　　　　　　　 : 13.8 Mb/s
宽度　　　　　　　　　　　　　　　 : 3 840 像素
高度　　　　　　　　　　　　　　　 : 1 600 像素
画面比例　　　　　　　　　　　　　 : 2.40:1
帧率模式　　　　　　　　　　　　　 : 恒定
帧率　　　　　　　　　　　　　　　 : 23.976 (24000/1001) FPS
位深　　　　　　　　　　　　　　　 : 10 位
扫描类型　　　　　　　　　　　　　 : 逐行扫描
流大小　　　　　　　　　　　　　　 : 6.15 GiB (96%)
默认　　　　　　　　　　　　　　　 : 是
强制　　　　　　　　　　　　　　　 : 否
色彩原色　　　　　　　　　　　　　 : BT.2020

音频
ＩＤ　　　　　　　　　　　　　　　 : 2
格式　　　　　　　　　　　　　　　 : E-AC-3 JOC
编解码器　ＩＤ　　　　　　　　　　 : A_EAC3
码率模式　　　　　　　　　　　　　 : 恒定码率
码率　　　　　　　　　　　　　　　 : 576 kb/s
声道数　　　　　　　　　　　　　　 : 6 声道
采样率　　　　　　　　　　　　　　 : 48.0 kHz
压缩模式　　　　　　　　　　　　　 : 有损
标题　　　　　　　　　　　　　　　 : English
语言　　　　　　　　　　　　　　　 : 英语 (English)
默认　　　　　　　　　　　　　　　 : 是

文本 #1
ＩＤ　　　　　　　　　　　　　　　 : 3
格式　　　　　　　　　　　　　　　 : PGS
编解码器　ＩＤ　　　　　　　　　　 : S_HDMV/PGS
编解码器　ＩＤ／信息　　　　　　　 : Picture based subtitle format used on BDs/HD-DVDs
标题　　　　　　　　　　　　　　　 : chs&eng
语言　　　　　　　　　　　　　　　 : 中文 (简体)
强制　　　　　　　　　　　　　　　 : 否

菜单
００：０１：５８．０００　　　　　 : en:Chapter 01
`;
check('中文界面：整块得分过门槛', m.scoreMediaInfo(ZH_MI) >= 6, String(m.scoreMediaInfo(ZH_MI)));
const zh = m.parseInfo(ZH_MI);
check('中文界面：文件名', zh.fileName === 'The.Boys.S05E01.2160p.AMZN.WEB-DL.DV.HDR.H265.DDP5.1.Atmos-BiVerse@ADWeb.mkv', zh.fileName);
check('中文界面：体积', zh.size === '6.43 GiB', zh.size);
check('中文界面：时长 1小时 3 分钟', zh.duration === '1h 3min', zh.duration);
check('中文界面：分辨率 3840 x 1600 (2.40:1)', zh.resolution === '3840 x 1600 (2.40:1)', zh.resolution);
check('中文界面：日期', zh.date === '2026-05-20', zh.date);
check('中文界面：视频 H.265 @ 13.8 Mbps', zh.video[0] === 'H.265 @ 13.8 Mbps', zh.video[0]);
check('中文界面：音频 DD+ Atmos 5.1 @ 576 Kbps', /DD\+ Atmos 5\.1 @ 576 Kbps/.test(zh.audio[0] || ''), zh.audio[0]);
check('中文界面：位深进参数', /10 bit/.test(zh.params), zh.params);
check('中文界面：字幕中文简体 SUP', /Chinese \(Simplified\) SUP/.test(zh.subtitle[0] || ''), zh.subtitle[0]);
check('中文界面：强制 / 默认 译回 Yes/No（不出现强制标记）', !/强制/.test(zh.subtitle[0] || ''), zh.subtitle[0]);
check('中文界面：deZhNames 幂等', m.deZhNames(m.deZhNames(ZH_MI)) === m.deZhNames(ZH_MI));
check('中文界面：英文文本零改动', m.deZhNames(plainQuoted) === plainQuoted);


// ---------- ⑥ 短格式 BDInfo：每条音轨只出现一次 ----------
// 「Audio: English / DTS-HD Master Audio / 5.1 …」这种行既是 kv（Key: value）又长得像
// 「段头直接带值」，两份都收就会让卡片上 5 条音轨变 10 条（SSD 那份公告就是这样）。
const BD_SHORT = `媒体信息
Disc Title:
Disc Label: Bedtime Stories 2008 1080p CHN Blu-ray AVC DTS-HD MA 5.1-lullabyevil
Disc Size: 30,162,794,147 bytes
Protection: AACS
Playlist: 00034.MPLS
Size: 23,603,232,768 bytes
Length: 1:39:13.989
Total Bitrate: 31.71 Mbps
Video: MPEG-4 AVC Video / 23374 kbps / 1080p / 23.976 fps / 16:9 / High Profile 4.1
Audio: English / DTS-HD Master Audio / 5.1 / 48 kHz / 3937 kbps / 24-bit (DTS Core: 5.1 / 48 kHz / 1509 kbps / 24-bit)
Audio: Spanish / Dolby Digital Audio / 5.1 / 48 kHz / 640 kbps / DN -31dB
Audio: Portuguese / Dolby Digital Audio / 5.1 / 48 kHz / 640 kbps / DN -31dB
Audio: Chinese / Dolby Digital Audio / 2.0 / 48 kHz / 192 kbps / DN -31dB / Dolby Surround
Audio: Thai / Dolby Digital Audio / 5.1 / 48 kHz / 640 kbps / DN -31dB
Subtitle: English / 41.499 kbps
Subtitle: Spanish / 37.912 kbps
Subtitle: Chinese / 35.948 kbps
Subtitle: Thai / 38.281 kbps
`;
const bdS = m.parseBDInfo(BD_SHORT);
check('短格式：5 条音轨不重复', bdS.audio.length === 5, bdS.audio.length + ' 条：' + bdS.audio.join(' | '));
check('短格式：音轨顺序没乱', /英语 DTS-HD MA 5\.1/.test(bdS.audio[0]) && /泰语 DD 5\.1/.test(bdS.audio[4]), bdS.audio.join(' | '));
check('短格式：字幕 4 条', bdS.subtitle.length === 4, String(bdS.subtitle.length));

console.log(fail ? '\n' + fail + ' 项未通过' : '\n全部通过');
process.exit(fail ? 1 : 0);
