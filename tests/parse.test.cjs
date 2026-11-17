// 解析自检（纯 Node，不需要浏览器）：
//   ① 原始参数名写法（CompleteName / FileSize/String / Format_Version，-f 或原始参数名导出）
//      以前只认得 General 段头，得分停在 5 分（门槛 6），整块「识别份数 0」——这里钉死；
//   ② 普通写法（Complete name / File size）不能被这次改动带坏；
//   ③ deRawNames 必须幂等，且对没有标签的普通文本零改动。
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

console.log(fail ? '\n' + fail + ' 项未通过' : '\n全部通过');
process.exit(fail ? 1 : 0);
