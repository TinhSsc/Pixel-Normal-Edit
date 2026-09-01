import fs from 'fs';
import path from 'path';

const domain = 'https://pixel-normal-edit.vercel.app';
const langs = ['en', 'vi', 'id', 'ru', 'th'];
const tools = [
  'home',
  'convert',
  'compress',
  'resize',
  'crop',
  'rotate',
  'frames-to-media',
  'media-to-frames',
  'gif-simplify'
];

const toolNames = {
  en: {
    home: 'Pixel Art Editor & Image Studio',
    convert: 'Convert Image Format (WebP, PNG, JPG, GIF)',
    compress: 'Compress & Reduce Image Size',
    resize: 'Resize Image & Change Resolution',
    crop: 'Crop Image by Pixel & Aspect Ratio',
    rotate: 'Rotate & Flip Image',
    'frames-to-media': 'Merge Images to GIF / Video',
    'media-to-frames': 'Extract GIF / Video to Frames',
    'gif-simplify': 'Simplify GIF & Speed Up Video'
  },
  vi: {
    home: 'Trình chỉnh sửa Pixel Art & Xử lý ảnh',
    convert: 'Chuyển đổi định dạng ảnh (WebP, PNG, JPG, GIF)',
    compress: 'Nén giảm dung lượng ảnh',
    resize: 'Đổi kích thước & độ phân giải ảnh',
    crop: 'Cắt ảnh chuẩn pixel & tỷ lệ',
    rotate: 'Xoay & Lật ảnh',
    'frames-to-media': 'Ghép ảnh thành GIF / Video',
    'media-to-frames': 'Tách GIF / Video thành từng khung hình',
    'gif-simplify': 'Tối ưu GIF & Tăng tốc video'
  },
  id: {
    home: 'Editor Seni Piksel & Studio Gambar',
    convert: 'Konversi Format Gambar (WebP, PNG, JPG, GIF)',
    compress: 'Kompres Ukuran Gambar',
    resize: 'Ubah Ukuran & Resolusi Gambar',
    crop: 'Potong Gambar Berdasarkan Rasio & Piksel',
    rotate: 'Putar & Balik Gambar',
    'frames-to-media': 'Gabungkan Gambar ke GIF / Video',
    'media-to-frames': 'Ekstrak GIF / Video ke Gambar',
    'gif-simplify': 'Sederhanakan GIF & Percepat Video'
  },
  ru: {
    home: 'Редактор пиксельной графики и студия изображений',
    convert: 'Конвертер форматов (WebP, PNG, JPG, GIF)',
    compress: 'Сжатие и оптимизация изображений',
    resize: 'Изменение размера и разрешения',
    crop: 'Обрезка изображений по пикселям и пропорциям',
    rotate: 'Поворот и отражение изображений',
    'frames-to-media': 'Создание GIF / Видео из картинок',
    'media-to-frames': 'Извлечение кадров из GIF / Видео',
    'gif-simplify': 'Оптимизация GIF и ускорение видео'
  },
  th: {
    home: 'โปรแกรมแก้ไข Pixel Art และสตูดิโอประมวลผลภาพ',
    convert: 'แปลงไฟล์รูปภาพ (WebP, PNG, JPG, GIF)',
    compress: 'บีบอัดลดขนาดไฟล์รูปภาพ',
    resize: 'ปรับขนาดและความละเอียดรูปภาพ',
    crop: 'ตัดรูปภาพตามพิกเซลและอัตราส่วน',
    rotate: 'หมุนและพลิกรูปภาพ',
    'frames-to-media': 'รวมรูปภาพเป็น GIF / วิดีโอ',
    'media-to-frames': 'แยกเฟรมรูปภาพจาก GIF / วิดีโอ',
    'gif-simplify': 'ลดขนาด GIF และเร่งความเร็ววิดีโอ'
  }
};

const SEO_DATA = {
  en: {
    home: {
      title: "Top 1 Image Processing Tool & Pixel Art Editor | Pixel Normal Edit",
      desc: "Browser-based image processing platform and Pixel Art editor. Fast, 100% private, and completely free.",
      keywords: "pixel art editor, draw pixel art online, pixel art tool, pixel normal edit, create pixel art, edit pixel, convert image format, compress image, resize image, crop image, rotate image, gif, video, crop picture pixels, image processor online, free image tools, secure image editor",
      h1: "Pixel Normal Edit - Free Online Pixel Art Editor & Image Studio",
      features: [
        { title: "Smart Canvas & Layers", desc: "Draw pixel art with custom canvas sizes from 1x1 to 256x256 with full layer and alpha channel support." },
        { title: "Integrated Mini-Tools", desc: "Convert, compress, crop, resize, and rotate pictures directly inside your browser." },
        { title: "100% Client-Side Privacy", desc: "Your images never leave your computer. Everything is processed locally with WebAssembly and Canvas." },
        { title: "Animation Studio", desc: "Create animated GIFs, merge multiple frames, or extract video frames directly." }
      ],
      faqs: [
        { q: "Is Pixel Normal Edit completely free?", a: "Yes, all tools including the Pixel Art editor, converter, and compressor are 100% free with no watermarks or file size restrictions." },
        { q: "Do I need to install any software or create an account?", a: "No installation or registration is needed. It runs smoothly directly in all modern web browsers." }
      ]
    },
    convert: {
      title: "Convert Image Formats - Fast, Free WebP PNG JPG GIF | Pixel Normal Edit",
      desc: "Convert WebP, PNG, JPG, and GIF images for free and extremely fast directly in your browser.",
      keywords: "convert image online, webp to png, png to jpg, jpg to webp, convert gif, free image format converter, batch image converter",
      h1: "Convert Image Formats Online - WebP, PNG, JPG, GIF",
      features: [
        { title: "Multi-Format Support", desc: "Seamlessly convert between WebP, PNG, JPEG, and animated GIF formats." },
        { title: "Batch Conversion", desc: "Convert multiple files simultaneously with high-speed processing." },
        { title: "Zero Quality Loss", desc: "Maintain optimal graphical sharpness with custom quality sliders." }
      ],
      faqs: [
        { q: "Which formats can I convert?", a: "You can convert between WebP, PNG, JPG/JPEG, and GIF files directly." },
        { q: "Are my uploaded images uploaded to a server?", a: "No, the entire conversion is executed locally on your machine." }
      ]
    },
    compress: {
      title: "Compress Image Size Online - Reduce JPG PNG WebP | Pixel Normal Edit",
      desc: "Tool to reduce JPG, PNG, and WebP image file sizes by optimizing graphical details while preserving visual fidelity.",
      keywords: "compress image online, reduce image size, shrink photo, optimize png, compress jpg, compress webp without quality loss",
      h1: "Compress & Reduce Image File Size Online",
      features: [
        { title: "Smart Compression", desc: "Reduce file sizes up to 80% with minimal visual degradation." },
        { title: "Realtime Preview", desc: "Compare original and compressed output before downloading." },
        { title: "Batch Compression", desc: "Compress dozens of images in seconds." }
      ],
      faqs: [
        { q: "How much file size reduction can I expect?", a: "Typically between 40% and 85% depending on image content and format." }
      ]
    },
    resize: {
      title: "Resize Image & Change Resolution Online | Pixel Normal Edit",
      desc: "Tool to quickly scale, zoom, or change image width and height pixel resolutions on any device.",
      keywords: "resize image online, change photo dimensions, scale image, image resolution changer, pixel resizer",
      h1: "Resize Image & Change Resolution Online",
      features: [
        { title: "Pixel-Perfect Resizing", desc: "Scale by exact pixel dimensions or percentages with aspect ratio lock." },
        { title: "Nearest Neighbor & Bilinear", desc: "Choose nearest neighbor interpolation for pixel art or smooth scaling for photos." }
      ],
      faqs: [
        { q: "Can I keep the aspect ratio when resizing?", a: "Yes, you can lock aspect ratio to scale width and height proportionally." }
      ]
    },
    crop: {
      title: "Crop Image Online - Ratio & Pixel-Perfect Cropping | Pixel Normal Edit",
      desc: "Free online image cropping tool. Supports free crop, pixel-exact cropping, or standard aspect ratios (16:9, 1:1, 4:3).",
      keywords: "crop image online, free crop tool, ratio crop, 16:9 crop, 1:1 crop, crop resolusi foto, crop picture pixels, cut image online",
      h1: "Crop Image Online - Fast & Accurate Cropper",
      features: [
        { title: "Standard Aspect Ratios", desc: "Quick presets for 1:1 (Square), 16:9 (Cover), 4:3, and 9:16 (Story)." },
        { title: "Pixel Precision", desc: "Fine-tune crop coordinates down to single pixels." }
      ],
      faqs: [
        { q: "Can I rotate while cropping?", a: "Yes, you can rotate and zoom to achieve the exact crop frame." }
      ]
    },
    rotate: {
      title: "Rotate & Flip Image Online | Pixel Normal Edit",
      desc: "Quickly rotate images 90, 180 degrees, or flip horizontally/vertically directly in your browser without quality loss.",
      keywords: "rotate image online, flip photo horizontally, flip vertical, mirror image, rotate 90 degrees",
      h1: "Rotate and Flip Images Online",
      features: [
        { title: "Instant Rotation", desc: "Rotate 90° clockwise, counter-clockwise, or 180° in one click." },
        { title: "Mirror & Flip", desc: "Flip horizontally or vertically with instantaneous canvas rendering." }
      ],
      faqs: [
        { q: "Does rotating reduce picture quality?", a: "No, lossless rotation preserves exact image pixels." }
      ]
    },
    'frames-to-media': {
      title: "Merge Images to GIF/Video & Convert Video to GIF | Pixel Normal Edit",
      desc: "Merge PNG, JPG, WebP frames into animated GIF or WebM. Convert Video to GIF and vice versa locally.",
      keywords: "merge images to gif, png to gif, create animated gif, video to gif converter, photos to gif animation, frames to media",
      h1: "Merge Images to Animated GIF / Video",
      features: [
        { title: "Frame Sequence to GIF", desc: "Import image sequences and customize FPS, frame delay, and looping." },
        { title: "Video to GIF Converter", desc: "Convert MP4, WebM clips directly into lightweight GIF animations." }
      ],
      faqs: [
        { q: "Can I adjust animation playback speed?", a: "Yes, you can set the frame delay or FPS dynamically." }
      ]
    },
    'media-to-frames': {
      title: "Extract GIF & Video to Image Frames | Pixel Normal Edit",
      desc: "Extract each frame of a GIF or Video (MP4, WebM) into separate image files. Processed locally.",
      keywords: "extract gif frames, video to images, frame extractor, split gif into images, save video frames",
      h1: "Extract GIF & Video into Image Frames",
      features: [
        { title: "Full Frame Deconstruction", desc: "Break down any GIF or video into individual PNG/JPG frames." },
        { title: "Download as ZIP", desc: "Package all extracted frames into a single convenient ZIP file." }
      ],
      faqs: [
        { q: "How many frames can I extract?", a: "You can extract all frames or sample frames based on custom intervals." }
      ]
    },
    'gif-simplify': {
      title: "Simplify GIF & Speed Up Video | Pixel Normal Edit",
      desc: "Reduce frame count to make GIF files lighter, or speed up videos by dropping interlaced frames locally.",
      keywords: "simplify gif, reduce gif size, drop gif frames, speed up video, lightweight gif maker",
      h1: "Simplify GIF & Speed Up Video Animations",
      features: [
        { title: "Frame Reduction", desc: "Cut GIF file size in half by dropping every 2nd or 3rd frame smoothly." },
        { title: "Speed Adjustment", desc: "Accelerate playback speed effortlessly." }
      ],
      faqs: [
        { q: "Why simplify a GIF?", a: "Simplifying frames drastically reduces file size for discord, forums, or web embeds." }
      ]
    }
  },
  vi: {
    home: {
      title: "Công Cụ Xử Lý Ảnh Top 1 & Vẽ Pixel Art | Pixel Normal Edit",
      desc: "Nền tảng xử lý ảnh và vẽ Pixel Art trực tiếp trên trình duyệt. Nhanh, bảo mật 100% và hoàn toàn miễn phí.",
      keywords: "chỉnh sửa ảnh pixel, vẽ pixel online, chuyển đổi ảnh, nén ảnh, cắt ảnh, ghép ảnh thành gif, video sang gif, tạo gif, cắt ảnh theo pixel",
      h1: "Pixel Normal Edit - Trình Chỉnh Sửa Pixel Art & Xử Lý Ảnh Trực Tuyến",
      features: [
        { title: "Vẽ Pixel Art Chuyên Nghiệp", desc: "Tạo ảnh pixel từ 1x1 đến 256x256 với đầy đủ layer, bảng màu và bộ công cụ tô thông minh." },
        { title: "Bộ Mini-Tools Tiện Ích", desc: "Chuyển đổi định dạng, nén, cắt, phóng to/thu nhỏ, xoay và lật ảnh ngay trên trình duyệt." },
        { title: "Bảo Mật Cục Bộ 100%", desc: "Toàn bộ dữ liệu được xử lý tại thiết bị của bạn, không tải ảnh lên máy chủ." },
        { title: "Xử Lý GIF & Video", desc: "Ghép ảnh thành GIF, tách khung hình từ video và tối ưu hóa dung lượng animation." }
      ],
      faqs: [
        { q: "Pixel Normal Edit có miễn phí không?", a: "Có, toàn bộ tính năng đều miễn phí 100%, không giới hạn số lượng và không chèn watermark." },
        { q: "Có cần cài đặt phần mềm không?", a: "Không cần cài đặt, bạn có thể sử dụng trực tiếp trên mọi trình duyệt web máy tính và điện thoại." }
      ]
    },
    convert: {
      title: "Chuyển Đổi Định Dạng Ảnh - Nhanh, Miễn Phí WebP PNG JPG GIF | Pixel Normal Edit",
      desc: "Chuyển đổi ảnh WebP, PNG, JPG, GIF miễn phí và cực nhanh trực tiếp trên máy tính/điện thoại.",
      keywords: "chuyển đổi định dạng ảnh, webp sang png, png sang jpg, jpg sang webp, đổi đuôi ảnh, chuyển ảnh online",
      h1: "Chuyển Đổi Định Dạng Ảnh Online - WebP, PNG, JPG, GIF",
      features: [
        { title: "Hỗ Trợ Đa Định Dạng", desc: "Chuyển đổi qua lại giữa WebP, PNG, JPEG, GIF không giới hạn." },
        { title: "Chuyển Đổi Hàng Loạt", desc: "Xử lý cùng lúc nhiều file với tốc độ siêu nhanh." }
      ],
      faqs: [
        { q: "Ảnh có bị giảm chất lượng khi chuyển đổi không?", a: "Bạn có thể tùy chỉnh thanh chất lượng để đảm bảo độ sắc nét cao nhất." }
      ]
    },
    compress: {
      title: "Nén Giảm Dung Lượng Ảnh Online - JPG PNG WebP | Pixel Normal Edit",
      desc: "Công cụ giảm dung lượng ảnh JPG, PNG, WebP bằng cách tối ưu hóa chi tiết đồ họa. Hoàn toàn miễn phí.",
      keywords: "nén ảnh online, giảm dung lượng ảnh, nén ảnh webp, nén png, làm nhẹ ảnh, tối ưu ảnh",
      h1: "Nén Giảm Dung Lượng Ảnh Online - Nhanh & Nhẹ",
      features: [
        { title: "Nén Thông Minh", desc: "Giảm tới 80% dung lượng mà mắt thường khó nhận biết sự thay đổi chất lượng." },
        { title: "So Sánh Trực Tiếp", desc: "Xem trước kết quả trước khi tải về máy." }
      ],
      faqs: [
        { q: "Có thể nén nhiều ảnh cùng lúc không?", a: "Có, công cụ hỗ trợ nén hàng loạt và tải về file ZIP." }
      ]
    },
    resize: {
      title: "Đổi Kích Thước Ảnh, Đổi Độ Phân Giải Width Height | Pixel Normal Edit",
      desc: "Công cụ phóng to, thu nhỏ hoặc đổi độ phân giải width height nhanh chóng trên mọi thiết bị.",
      keywords: "đổi kích thước ảnh, thay đổi độ phân giải, phóng to ảnh, thu nhỏ ảnh, resize ảnh online",
      h1: "Thay Đổi Kích Thước & Độ Phân Giải Ảnh Trực Tuyến",
      features: [
        { title: "Chuẩn Xác Từng Pixel", desc: "Tùy chỉnh độ rộng, độ cao theo pixel hoặc tỷ lệ phần trăm." },
        { title: "Khóa Tỷ Lệ Khung Hình", desc: "Giữ nguyên tỷ lệ gốc tránh làm méo mó hình ảnh." }
      ],
      faqs: [
        { q: "Có làm mờ ảnh khi thu nhỏ không?", a: "Thuật toán xử lý pixel giữ cho đường nét luôn rõ ràng, đặc biệt với Pixel Art." }
      ]
    },
    crop: {
      title: "Cắt Ảnh Online - Cắt Ảnh Theo Tỷ Lệ & Chuẩn Pixel | Pixel Normal Edit",
      desc: "Công cụ cắt ảnh online miễn phí. Hỗ trợ cắt tự do hoặc cắt theo tỷ lệ (16:9, 1:1, 4:3, 9:16) cực kỳ chuẩn xác.",
      keywords: "cắt ảnh online, cắt ảnh miễn phí, cắt theo tỷ lệ, cắt 16:9, cắt 1:1, cắt ảnh theo pixel, cắt ảnh chuẩn pixel",
      h1: "Cắt Ảnh Online - Nhanh Chóng & Chuẩn Xác Từng Pixel",
      features: [
        { title: "Tỷ Lệ Tiêu Chuẩn", desc: "Cài đặt sẵn các tỷ lệ phổ biến như Vuông 1:1, Ảnh bìa 16:9, Story 9:16." },
        { title: "Cắt Xén Tự Do", desc: "Dễ dàng kéo thả vùng chọn theo nhu cầu thực tế." }
      ],
      faqs: [
        { q: "Cắt ảnh có làm giảm chất lượng không?", a: "Khu vực được cắt giữ nguyên 100% độ phân giải gốc của ảnh." }
      ]
    },
    rotate: {
      title: "Xoay & Lật Ảnh Online Trực Tuyến | Pixel Normal Edit",
      desc: "Xoay ảnh 90, 180 độ hoặc lật ngang/dọc nhanh chóng ngay trên trình duyệt, không làm giảm chất lượng.",
      keywords: "xoay ảnh online, lật ảnh ngang, lật ảnh dọc, đảo chiều ảnh, xoay 90 độ",
      h1: "Xoay và Lật Ảnh Trực Tuyến Không Giảm Chất Lượng",
      features: [
        { title: "Xoay Đa Chiều", desc: "Xoay theo chiều kim đồng hồ, ngược chiều hoặc xoay 180 độ chỉ với 1 cú click." },
        { title: "Lật Gương Đối Xứng", desc: "Lật ảnh theo trục ngang và trục dọc tức thì." }
      ],
      faqs: [
        { q: "Thao tác xoay có tốn thời gian không?", a: "Thực thi gần như tức thì trên card đồ họa máy tính." }
      ]
    },
    'frames-to-media': {
      title: "Ghép Ảnh Thành GIF/Video, Chuyển Video Sang GIF | Pixel Normal Edit",
      desc: "Ghép nhiều ảnh PNG, JPG, WebP thành ảnh động GIF hoặc WebM. Chuyển đổi Video sang GIF và ngược lại. Xử lý offline.",
      keywords: "ghép ảnh thành gif, tạo gif động, làm video từ ảnh, chuyển video sang gif, video sang ảnh động",
      h1: "Ghép Ảnh Thành Ảnh Động GIF & Chuyển Video Sang GIF",
      features: [
        { title: "Ghép Khung Hình Mượt Mà", desc: "Tự do điều chỉnh FPS và thời gian chuyển cảnh giữa các khung hình." },
        { title: "Chuyển Đổi Video Sang GIF", desc: "Cắt và chuyển đổi các clip ngắn thành file GIF tiện chia sẻ." }
      ],
      faqs: [
        { q: "Có giới hạn số khung hình ghép không?", a: "Bạn có thể ghép hàng chục khung hình thoải mái tùy cấu hình máy tính." }
      ]
    },
    'media-to-frames': {
      title: "Tách Ảnh Từ GIF / Video Thành Từng Khung Hình | Pixel Normal Edit",
      desc: "Trích xuất từng khung hình của GIF hoặc Video (MP4, WebM) thành các file ảnh riêng biệt. Xử lý hoàn toàn tại máy.",
      keywords: "tách ảnh từ gif, tách frame video, trích xuất khung hình, chia nhỏ gif",
      h1: "Tách Khung Hình Từ GIF & Video Thành Ảnh Riêng Biệt",
      features: [
        { title: "Trích Xuất Đầy Đủ", desc: "Tách từng frame thành định dạng PNG hoặc JPG sắc nét." },
        { title: "Tải Về Trọn Gói", desc: "Đóng gói toàn bộ khung hình vào file ZIP tải về nhanh chóng." }
      ],
      faqs: [
        { q: "Chất lượng khung hình tách ra thế nào?", a: "Ảnh xuất ra giữ nguyên độ nét gốc của video hoặc GIF." }
      ]
    },
    'gif-simplify': {
      title: "Tối Ưu GIF / Tăng Tốc Video Đơn Giản | Pixel Normal Edit",
      desc: "Giảm số lượng khung hình để làm nhẹ GIF, hoặc tăng tốc video bằng cách bỏ bớt frame. Xử lý offline.",
      keywords: "làm nhẹ gif, tối ưu gif, giảm frame gif, tăng tốc video",
      h1: "Tối Ưu Làm Nhẹ GIF & Tăng Tốc Video",
      features: [
        { title: "Giảm Bớt Khung Hình", desc: "Tự động lược bỏ các frame dư thừa để giảm dung lượng file GIF." },
        { title: "Tăng Tốc Chuyển Động", desc: "Tăng tốc độ khung hình cho cảm giác mượt mà và nhanh hơn." }
      ],
      faqs: [
        { q: "Tại sao nên tối ưu GIF?", a: "Giúp ảnh GIF tải nhanh hơn trên Discord, Zalo hoặc chèn vào website." }
      ]
    }
  },
  id: {
    home: {
      title: "Alat Pengolah Gambar No. 1 & Editor Seni Piksel | Pixel Normal Edit",
      desc: "Platform pengolah gambar dan editor Pixel Art di browser. Cepat, aman, dan gratis 100%.",
      keywords: "editor pixel art, gambar pixel online, alat pixel, convert gambar, kompres gambar, potong gambar",
      h1: "Pixel Normal Edit - Editor Pixel Art & Pengolah Gambar Online Gratis",
      features: [
        { title: "Editor Piksel Lengkap", desc: "Buat gambar piksel dengan layer, palet warna, dan alat gambar lengkap." },
        { title: "Privasi Penuh", desc: "Gambar tidak pernah diunggah ke server." }
      ],
      faqs: [{ q: "Apakah alat ini gratis?", a: "Ya, sepenuhnya gratis tanpa batas atau watermark." }]
    },
    convert: {
      title: "Konversi Format Gambar - Cepat, Gratis WebP PNG JPG GIF | Pixel Normal Edit",
      desc: "Konversi gambar WebP, PNG, JPG, GIF secara gratis dan sangat cepat di browser Anda.",
      keywords: "konversi gambar online, webp ke png, png ke jpg, ubah format foto",
      h1: "Konversi Format Gambar Online Gratis",
      features: [{ title: "Dukungan Format Luas", desc: "Konversi antara WebP, PNG, JPG, dan GIF secara mudah." }],
      faqs: [{ q: "Apakah ada batasan ukuran file?", a: "Diproses di browser tanpa batasan server." }]
    },
    compress: {
      title: "Kompres Ukuran Gambar Online - JPG PNG WebP | Pixel Normal Edit",
      desc: "Alat untuk mengurangi ukuran gambar JPG, PNG, WebP dengan mengoptimalkan detail grafis.",
      keywords: "kompres foto online, kecilkan ukuran gambar, optimasi png, kompres jpg",
      h1: "Kompres dan Kecilkan Ukuran Gambar Online",
      features: [{ title: "Kompresi Cerdas", desc: "Kecilkan ukuran file hingga 80% dengan kualitas tetap tajam." }],
      faqs: [{ q: "Bagaimana cara kerjanya?", a: "Mengoptimalkan data gambar langsung di memori browser." }]
    },
    resize: {
      title: "Ubah Ukuran Gambar, Ganti Resolusi Width Height | Pixel Normal Edit",
      desc: "Alat untuk memperbesar, memperkecil, atau mengubah resolusi lebar dan tinggi dengan cepat.",
      keywords: "ubah resolusi gambar, resize foto online, skala gambar",
      h1: "Ubah Ukuran & Resolusi Gambar Online",
      features: [{ title: "Presisi Piksel", desc: "Atur dimensi lebar dan tinggi sesuai keinginan." }],
      faqs: [{ q: "Bisa mengunci rasio aspek?", a: "Ya, rasio aspek dapat dikunci." }]
    },
    crop: {
      title: "Potong Gambar Online - Akurat, Mudah Berdasarkan Rasio | Pixel Normal Edit",
      desc: "Alat pemotong gambar online gratis. Mendukung pemotongan bebas atau berdasarkan rasio.",
      keywords: "potong gambar online, potong foto gratis, crop 16:9, crop 1:1",
      h1: "Potong Gambar Online Cepat & Akurat",
      features: [{ title: "Preset Rasio Populer", desc: "Potong cepat untuk 1:1, 16:9, 4:3, atau bebas." }],
      faqs: [{ q: "Apakah gambar kehilangan kualitas?", a: "Bagian yang dipotong mempertahankan kualitas aslinya." }]
    },
    rotate: {
      title: "Putar & Balik Gambar Online | Pixel Normal Edit",
      desc: "Putar gambar 90, 180 derajat atau balik secara horizontal/vertikal langsung di browser.",
      keywords: "putar gambar, rotasi foto 90 derajat, balik gambar horizontal",
      h1: "Putar dan Balik Gambar Tanpa Hilang Kualitas",
      features: [{ title: "Rotasi Instan", desc: "Putar 90°, 180° atau balik dalam satu klik." }],
      faqs: [{ q: "Apakah memproses cepat?", a: "Sangat cepat karena menggunakan akselerasi grafis." }]
    },
    'frames-to-media': {
      title: "Gabung Gambar ke GIF/Video, Konversi Video ke GIF | Pixel Normal Edit",
      desc: "Gabungkan beberapa gambar PNG, JPG, WebP menjadi GIF atau WebM animasi. Diproses lokal.",
      keywords: "gabung gambar ke gif, buat animasi gif, video ke gif",
      h1: "Gabungkan Gambar Menjadi Animasi GIF & Video",
      features: [{ title: "Kecepatan FPS Kustom", desc: "Atur jeda dan frame rate animasi dengan mudah." }],
      faqs: [{ q: "Bisa ubah video jadi GIF?", a: "Ya, dukung konversi video MP4/WebM ke GIF." }]
    },
    'media-to-frames': {
      title: "Ekstrak Gambar dari GIF / Video | Pixel Normal Edit",
      desc: "Ekstrak setiap frame dari GIF atau Video (MP4, WebM) menjadi file gambar terpisah.",
      keywords: "ekstrak frame gif, simpan frame video, pisahkan gif",
      h1: "Ekstrak Frame dari Animasi GIF & Video",
      features: [{ title: "Unduh File ZIP", desc: "Simpan semua frame yang diekstrak dalam satu ZIP." }],
      faqs: [{ q: "Apakah aman?", a: "100% aman dan diproses langsung di perangkat Anda." }]
    },
    'gif-simplify': {
      title: "Sederhanakan GIF / Percepat Video | Pixel Normal Edit",
      desc: "Kurangi jumlah frame untuk membuat GIF lebih ringan, atau percepat video.",
      keywords: "kecilkan gif, optimalkan frame gif, percepat video",
      h1: "Sederhanakan GIF & Percepat Animasi Video",
      features: [{ title: "Hapus Frame Berlebih", desc: "Membuat ukuran file GIF jauh lebih kecil." }],
      faqs: [{ q: "Untuk apa menyederhanakan GIF?", a: "Membuat GIF lebih ringan saat dikirim di chat." }]
    }
  },
  ru: {
    home: {
      title: "Топ-1 инструмент для обработки изображений и Pixel Art | Pixel Normal Edit",
      desc: "Платформа для обработки изображений и рисования пиксельной графики в браузере. Быстро и бесплатно.",
      keywords: "редактор пиксельной графики, рисование пикселей онлайн, конвертер изображений, сжатие изображений, обрезка изображений",
      h1: "Pixel Normal Edit - Бесплатный онлайн редактор пиксель-арта",
      features: [
        { title: "Полнофункциональный редактор", desc: "Слои, палитры и умные инструменты для пиксельной графики." },
        { title: "Полная приватность", desc: "Файлы обрабатываются прямо в браузере и не отправляются на сервер." }
      ],
      faqs: [{ q: "Это бесплатно?", a: "Да, все инструменты бесплатны без ограничений и водяных знаков." }]
    },
    convert: {
      title: "Конвертер изображений - Быстро, Бесплатно WebP PNG JPG GIF | Pixel Normal Edit",
      desc: "Бесплатно конвертируйте изображения WebP, PNG, JPG, GIF с максимальной скоростью.",
      keywords: "конвертер изображений онлайн, webp в png, png в jpg, конвертировать фото",
      h1: "Онлайн конвертер форматов изображений",
      features: [{ title: "Поддержка форматов", desc: "Конвертация между WebP, PNG, JPG и GIF." }],
      faqs: [{ q: "Какое качество на выходе?", a: "Качество сохраняется с максимальной точностью." }]
    },
    compress: {
      title: "Сжиматель изображений онлайн - Сжать JPG PNG WebP | Pixel Normal Edit",
      desc: "Инструмент для уменьшения размера изображений JPG, PNG, WebP без потери видимого качества.",
      keywords: "сжать изображение, уменьшить размер фото, оптимизация png, сжатие jpg",
      h1: "Сжатие и оптимизация размера изображений",
      features: [{ title: "Умное сжатие", desc: "Уменьшение веса файлов до 80%." }],
      faqs: [{ q: "Можно сжимать сразу несколько фото?", a: "Да, поддерживается пакетная обработка." }]
    },
    resize: {
      title: "Изменение размера, смена разрешения изображений | Pixel Normal Edit",
      desc: "Инструмент для быстрого масштабирования или изменения разрешения ширины и высоты на любом устройстве.",
      keywords: "изменить размер фото, разрешение картинки, масштабирование онлайн",
      h1: "Изменение размера и разрешения фото онлайн",
      features: [{ title: "Точность пикселей", desc: "Установка точных параметров ширины и высоты." }],
      faqs: [{ q: "Сохраняются ли пропорции?", a: "Да, есть функция блокировки пропорций." }]
    },
    crop: {
      title: "Обрезка изображений онлайн - Точно, Удобно по пропорциям | Pixel Normal Edit",
      desc: "Бесплатный онлайн-инструмент для обрезки изображений. Поддерживает свободную обрезку или по соотношению сторон.",
      keywords: "обрезка изображений онлайн, кадрирование фото, обрезка 16:9, обрезка 1:1",
      h1: "Быстрая и точная обрезка изображений онлайн",
      features: [{ title: "Популярные пропорции", desc: "Готовые шаблоны 1:1, 16:9, 4:3 и произвольный выбор." }],
      faqs: [{ q: "Теряется ли четкость?", a: "Нет, вырезанная область сохраняет исходное качество." }]
    },
    rotate: {
      title: "Поворот и отражение изображений онлайн | Pixel Normal Edit",
      desc: "Поворачивайте изображения на 90, 180 градусов или отражайте горизонтально/вертикально.",
      keywords: "повернуть фото онлайн, отразить зеркально, поворот на 90 градусов",
      h1: "Поворот и зеркальное отражение изображений",
      features: [{ title: "Быстрый поворот", desc: "Поворот в любую сторону и зеркальное отражение." }],
      faqs: [{ q: "Сколько времени занимает обработка?", a: "Мгновенно прямо на вашем устройстве." }]
    },
    'frames-to-media': {
      title: "Объединение изображений в GIF/Видео, конвертер видео в GIF | Pixel Normal Edit",
      desc: "Объединяйте PNG, JPG, WebP в анимированные GIF или WebM. Конвертируйте видео в GIF и обратно.",
      keywords: "склеить картинки в gif, создать анимацию, видео в гифку",
      h1: "Создание GIF анимации и видео из изображений",
      features: [{ title: "Настройка FPS", desc: "Управление скоростью и задержкой кадров." }],
      faqs: [{ q: "Работает с видео?", a: "Да, поддерживает MP4 и WebM." }]
    },
    'media-to-frames': {
      title: "Извлечение кадров из GIF / Видео в изображения | Pixel Normal Edit",
      desc: "Извлекайте каждый кадр GIF или видео (MP4, WebM) в отдельные изображения.",
      keywords: "разбить гифку на кадры, извлечь кадры из видео, кадры в zip",
      h1: "Извлечение отдельных кадров из GIF и видео",
      features: [{ title: "Скачивание в ZIP", desc: "Все кадры аккуратно упаковываются в архив." }],
      faqs: [{ q: "Где хранятся файлы?", a: "Файлы остаются только на вашем компьютере." }]
    },
    'gif-simplify': {
      title: "Упрощение GIF / Ускорение видео анимаций | Pixel Normal Edit",
      desc: "Уменьшайте количество кадров для облегчения GIF или ускоряйте видео, убирая лишние кадры.",
      keywords: "уменьшить вес гифки, облегчить gif, ускорить анимацию",
      h1: "Оптимизация и облегчение веса GIF анимаций",
      features: [{ title: "Удаление лишних кадров", desc: "Значительно уменьшает вес GIF для чатов и сайтов." }],
      faqs: [{ q: "Для чего это нужно?", a: "Чтобы GIF быстрее загружался в Discord и Telegram." }]
    }
  },
  th: {
    home: {
      title: "เครื่องมือประมวลผลภาพอันดับ 1 และโปรแกรมวาด Pixel Art | Pixel Normal Edit",
      desc: "แพลตฟอร์มประมวลผลภาพและวาดภาพ Pixel Art ในเบราว์เซอร์ เร็ว ปลอดภัย 100% และฟรีทั้งหมด",
      keywords: "ตัวแก้ไขพิกเซล อาร์ต วาดพิกเซลออนไลน์ เครื่องมือพิกเซล แปลงภาพ บีบอัดภาพ ตัดภาพ",
      h1: "Pixel Normal Edit - โปรแกรมแก้ไข Pixel Art และเครื่องมือจัดการรูปภาพออนไลน์",
      features: [
        { title: "เครื่องมือพิกเซลระดับมืออาชีพ", desc: "รองรับเลเยอร์ จานสี และการวาดภาพพิกเซลครบวงจร" },
        { title: "ความเป็นส่วนตัวสมบูรณ์แบบ", desc: "ประมวลผลในเบราว์เซอร์ รูปภาพไม่ถูกส่งไปยังเซิร์ฟเวอร์" }
      ],
      faqs: [{ q: "ใช้งานได้ฟรีหรือไม่?", a: "ใช้งานได้ฟรี 100% ไม่มีลายน้ำและไม่จำกัดจำนวนครั้ง" }]
    },
    convert: {
      title: "ตัวแปลงรูปแบบภาพ - เร็ว ฟรี WebP PNG JPG GIF | Pixel Normal Edit",
      desc: "แปลงภาพ WebP, PNG, JPG, GIF ฟรีและเร็วมากในเบราว์เซอร์ของคุณ",
      keywords: "แปลงไฟล์รูปภาพออนไลน์, แปลง webp เป็น png, png เป็น jpg, เปลี่ยนนามสกุลภาพ",
      h1: "แปลงรูปแบบไฟล์รูปภาพออนไลน์ฟรี",
      features: [{ title: "รองรับหลายรูปแบบ", desc: "แปลงระหว่าง WebP, PNG, JPG, GIF ได้อย่างง่ายดาย" }],
      faqs: [{ q: "คุณภาพรูปภาพจะลดลงไหม?", a: "สามารถปรับแถบคุณภาพเพื่อให้ได้ความคมชัดสูงสุดได้" }]
    },
    compress: {
      title: "ตัวบีบอัดภาพออนไลน์ - ลดขนาดไฟล์ JPG PNG WebP | Pixel Normal Edit",
      desc: "เครื่องมือลดขนาดภาพ JPG, PNG, WebP โดยเพิ่มประสิทธิภาพรายละเอียดกราฟิก ฟรีทั้งหมด",
      keywords: "บีบอัดภาพออนไลน์, ลดขนาดรูปภาพ, ย่อขนาดไฟล์ภาพ, ทำรูปให้เบาลง",
      h1: "บีบอัดและลดขนาดไฟล์รูปภาพออนไลน์",
      features: [{ title: "การบีบอัดอัจฉริยะ", desc: "ลดขนาดไฟล์ได้สูงสุด 80% โดยยังคงความคมชัด" }],
      faqs: [{ q: "บีบอัดหลายภาพพร้อมกันได้ไหม?", a: "ได้ รองรับการประมวลผลเป็นชุดและดาวน์โหลดเป็น ZIP" }]
    },
    resize: {
      title: "เปลี่ยนขนาด เปลี่ยนความละเอียดรูปภาพ Width Height | Pixel Normal Edit",
      desc: "เครื่องมือขยาย ย่อ หรือเปลี่ยนความละเอียดกว้าง-สูงได้อย่างรวดเร็วบนทุกอุปกรณ์",
      keywords: "ปรับขนาดรูปภาพ, เปลี่ยนความละเอียดภาพ, ขยายรูปภาพ, ย่อรูปภาพออนไลน์",
      h1: "ปรับขนาดและความละเอียดรูปภาพออนไลน์",
      features: [{ title: "ความแม่นยำระดับพิกเซล", desc: "กำหนดความกว้างและความสูงตามต้องการ" }],
      faqs: [{ q: "ล็อคอัตราส่วนภาพได้หรือไม่?", a: "ได้ มีตัวเลือกคงอัตราส่วนเดิมของภาพไว้" }]
    },
    crop: {
      title: "ตัดภาพออนไลน์ - แม่นยำ ง่ายดายตามอัตราส่วน | Pixel Normal Edit",
      desc: "เครื่องมือตัดภาพออนไลน์ฟรี รองรับการตัดอิสระหรือตัดตามสัดส่วน (16:9, 1:1, 4:3)",
      keywords: "ตัดภาพออนไลน์, ครอปรูปภาพ, ตัดภาพ 16:9, ตัดภาพ 1:1, ตัดภาพตามพิกเซล",
      h1: "ตัดภาพและครอบตัดรูปภาพออนไลน์อย่างแม่นยำ",
      features: [{ title: "อัตราส่วนยอดนิยม", desc: "เทมเพลต 1:1, 16:9, 4:3 หรือกำหนดขอบเขตเองได้อิสระ" }],
      faqs: [{ q: "ภาพจะสูญเสียความคมชัดหรือไม่?", a: "พื้นที่ที่ตัดจะคงความละเอียดดั้งเดิมไว้อย่างสมบูรณ์" }]
    },
    rotate: {
      title: "หมุนและพลิกรูปภาพออนไลน์ | Pixel Normal Edit",
      desc: "หมุนรูปภาพ 90, 180 องศา หรือพลิกแนวนอน/แนวตั้งในเบราว์เซอร์โดยไม่สูญเสียคุณภาพ",
      keywords: "หมุนรูปภาพออนไลน์, พลิกภาพกระจก, หมุนภาพ 90 องศา, กลับด้านรูปภาพ",
      h1: "หมุนและพลิกรูปภาพออนไลน์อย่างรวดเร็ว",
      features: [{ title: "หมุนได้ทันที", desc: "หมุน 90 องศา หรือกลับด้านภาพแนวนอน/แนวตั้งในคลิกเดียว" }],
      faqs: [{ q: "ใช้เวลานานหรือไม่?", a: "ทำงานได้ทันทีบนอุปกรณ์ของคุณ" }]
    },
    'frames-to-media': {
      title: "รวมรูปภาพเป็น GIF/วิดีโอ แปลงวิดีโอเป็น GIF | Pixel Normal Edit",
      desc: "รวม PNG, JPG, WebP เป็น GIF หรือ WebM แบบเคลื่อนไหว แปลงวิดีโอเป็น GIF และในทางกลับกัน",
      keywords: "รวมรูปภาพเป็น gif, สร้างภาพเคลื่อนไหว gif, แปลงวิดีโอเป็น gif",
      h1: "รวมรูปภาพเป็นภาพเคลื่อนไหว GIF และวิดีโอ",
      features: [{ title: "กำหนด FPS ได้", desc: "ควบคุมความเร็วและเวลาการแสดงแต่ละเฟรมได้อย่างอิสระ" }],
      faqs: [{ q: "แปลงวิดีโอเป็น GIF ได้ไหม?", a: "รองรับการแปลงไฟล์ MP4/WebM เป็นภาพเคลื่อนไหว GIF" }]
    },
    'media-to-frames': {
      title: "แยกเฟรมจาก GIF / วิดีโอเป็นไฟล์รูปภาพ | Pixel Normal Edit",
      desc: "แยกเฟรมของ GIF หรือวิดีโอ (MP4, WebM) แต่ละเฟรมเป็นไฟล์รูปภาพแยกกัน",
      keywords: "แยกเฟรม gif, แยกรูปภาพจากวิดีโอ, เซฟเฟรมภาพ",
      h1: "แยกเฟรมภาพจากภาพเคลื่อนไหว GIF และวิดีโอ",
      features: [{ title: "ดาวน์โหลดเป็น ZIP", desc: "รวมทุกเฟรมที่แยกได้ไว้ในไฟล์ ZIP เดียว" }],
      faqs: [{ q: "ปลอดภัยหรือไม่?", a: "ปลอดภัย 100% ประมวลผลในเครื่องของคุณทั้งหมด" }]
    },
    'gif-simplify': {
      title: "ทำให้ GIF ง่ายขึ้น / เร่งวิดีโอให้เร็วขึ้น | Pixel Normal Edit",
      desc: "ลดจำนวนเฟรมเพื่อทำให้ GIF เบากว่า หรือเร่งวิดีโอด้วยการข้ามเฟรม ประมวลผลออฟไลน์",
      keywords: "ลดขนาด gif, ลดเฟรมภาพเคลื่อนไหว, เร่งความเร็ววิดีโอ",
      h1: "ลดขนาดทำให้ไฟล์ GIF เบาลงและเร่งความเร็ว",
      features: [{ title: "ตัดเฟรมที่ไม่จำเป็น", desc: "ช่วยลดขนาดไฟล์ GIF ได้อย่างมาก เหมาะสำหรับแชร์ในโซเชียล" }],
      faqs: [{ q: "ทำไมต้องลดเฟรม GIF?", a: "เพื่อให้โหลดเร็วขึ้นและส่งในแอปแชทได้อย่างง่ายดาย" }]
    }
  }
};

function generateBreadcrumb(lang, tool) {
  const currentToolName = toolNames[lang]?.[tool] || tool;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": lang === 'vi' ? 'Trang chủ' : 'Home',
        "item": `${domain}/${lang}/home`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": currentToolName,
        "item": `${domain}/${lang}/${tool}`
      }
    ]
  };
}

function generateWebPageSchema(lang, tool, data) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": data.title,
    "description": data.desc,
    "url": `${domain}/${lang}/${tool}`,
    "inLanguage": lang,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Pixel Normal Edit",
      "url": domain
    }
  };
}

function generateFAQSchema(data) {
  if (!data.faqs || data.faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };
}

function generateInternalLinks(currentLang, currentTool) {
  let html = `<section style="margin-top: 2rem; border-top: 1px solid #333; padding-top: 1.5rem;">
    <h2>${currentLang === 'vi' ? 'Các công cụ xử lý ảnh khác' : (currentLang === 'id' ? 'Alat Pengolah Gambar Lainnya' : (currentLang === 'ru' ? 'Другие инструменты обработки изображений' : (currentLang === 'th' ? 'เครื่องมือประมวลผลภาพอื่นๆ' : 'Other Image Processing Tools')))}</h2>
    <ul style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.75rem; list-style: none; padding: 0;">`;

  for (const t of tools) {
    const isCurrent = t === currentTool;
    const name = toolNames[currentLang]?.[t] || toolNames.en[t];
    const url = `/${currentLang}/${t}`;
    html += `\n      <li>
        <a href="${url}" style="color: ${isCurrent ? '#4ade80' : '#60a5fa'}; text-decoration: underline; font-weight: ${isCurrent ? 'bold' : 'normal'};">
          ${name}
        </a>
      </li>`;
  }
  html += `\n    </ul>\n  </section>`;
  return html;
}

function buildPrerenderedHTML(baseTemplate, lang, tool) {
  const data = SEO_DATA[lang]?.[tool] || SEO_DATA.en[tool] || SEO_DATA.en.home;
  const currentUrl = `${domain}/${lang}/${tool}`;

  let content = baseTemplate;

  // 1. Update <html lang="...">
  content = content.replace(/<html[^>]*>/i, `<html lang="${lang}">`);

  // 2. Replace <title>
  content = content.replace(/<title[^>]*>.*?<\/title>/is, `<title>${data.title}</title>`);

  // 3. Replace <meta name="description">
  if (content.includes('name="description"')) {
    content = content.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${data.desc}" />`);
  } else {
    content = content.replace('</head>', `  <meta name="description" content="${data.desc}" />\n</head>`);
  }

  // 4. Replace <meta name="keywords">
  if (data.keywords) {
    if (content.includes('name="keywords"')) {
      content = content.replace(/<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i, `<meta name="keywords" content="${data.keywords}" />`);
    } else {
      content = content.replace('</head>', `  <meta name="keywords" content="${data.keywords}" />\n</head>`);
    }
  }

  // 5. Replace <link rel="canonical">
  if (content.includes('rel="canonical"')) {
    content = content.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${currentUrl}" />`);
  } else {
    content = content.replace('</head>', `  <link rel="canonical" href="${currentUrl}" />\n</head>`);
  }

  // 6. Update Open Graph & Twitter meta tags
  content = content.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${data.title}" />`);
  content = content.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${data.desc}" />`);
  content = content.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${currentUrl}" />`);

  content = content.replace(/<meta\s+property="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="twitter:title" content="${data.title}" />`);
  content = content.replace(/<meta\s+property="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="twitter:description" content="${data.desc}" />`);
  content = content.replace(/<meta\s+property="twitter:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="twitter:url" content="${currentUrl}" />`);

  // 7. Inject Hreflang alternate links
  let hreflangs = '';
  for (const altLang of langs) {
    hreflangs += `  <link rel="alternate" hreflang="${altLang}" href="${domain}/${altLang}/${tool}" />\n`;
  }
  hreflangs += `  <link rel="alternate" hreflang="x-default" href="${domain}/en/${tool}" />\n`;

  // 8. Inject Schemas
  const breadcrumbSchema = JSON.stringify(generateBreadcrumb(lang, tool));
  const webPageSchema = JSON.stringify(generateWebPageSchema(lang, tool, data));
  const faqSchemaObj = generateFAQSchema(data);
  const faqSchema = faqSchemaObj ? `<script type="application/ld+json">\n${JSON.stringify(faqSchemaObj, null, 2)}\n</script>\n` : '';

  const structuredData = `
  ${hreflangs}
  <script type="application/ld+json">
${JSON.stringify(JSON.parse(breadcrumbSchema), null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(JSON.parse(webPageSchema), null, 2)}
  </script>
  ${faqSchema}
`;
  content = content.replace('</head>', `${structuredData}</head>`);

  // 9. Semantic pre-rendered content in #root
  let featuresHtml = '';
  if (data.features && data.features.length > 0) {
    featuresHtml = `
      <section style="margin-top: 1.5rem;">
        <h2>${lang === 'vi' ? 'Tính Năng Nổi Bật' : (lang === 'id' ? 'Fitur Utama' : (lang === 'ru' ? 'Основные возможности' : (lang === 'th' ? 'คุณสมบัติเด่น' : 'Key Features')))}</h2>
        <ul>
          ${data.features.map(f => `<li><strong>${f.title}:</strong> ${f.desc}</li>`).join('\n          ')}
        </ul>
      </section>
    `;
  }

  let faqsHtml = '';
  if (data.faqs && data.faqs.length > 0) {
    faqsHtml = `
      <section style="margin-top: 1.5rem;">
        <h2>${lang === 'vi' ? 'Câu Hỏi Thường Gặp (FAQ)' : (lang === 'id' ? 'Pertanyaan yang Sering Diajukan (FAQ)' : (lang === 'ru' ? 'Часто задаваемые вопросы (FAQ)' : (lang === 'th' ? 'คำถามที่พบบ่อย (FAQ)' : 'Frequently Asked Questions (FAQ)')))}</h2>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${data.faqs.map(faq => `
            <div>
              <h3 style="font-size: 1.1rem; margin-bottom: 0.25rem;">${faq.q}</h3>
              <p style="color: #666; margin: 0;">${faq.a}</p>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  const internalLinks = generateInternalLinks(lang, tool);

  const rootContent = `
    <main style="max-width: 960px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, -apple-system, sans-serif; color: #1e1e24; line-height: 1.6;">
      <header>
        <h1>${data.h1 || data.title}</h1>
        <p>${data.desc}</p>
      </header>
      ${featuresHtml}
      ${faqsHtml}
      ${internalLinks}
      <footer style="margin-top: 2rem; border-top: 1px solid #ddd; padding-top: 1rem; color: #888; font-size: 0.875rem;">
        <p>&copy; 2026 Pixel Normal Edit. All rights reserved.</p>
      </footer>
    </main>
  `;

  // Replace content inside <div id="root">...</div>
  content = content.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${rootContent}</div>`);

  return content;
}

function main() {
  const distDir = path.resolve('dist');
  const indexHtmlPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexHtmlPath)) {
    console.error('Error: dist/index.html does not exist. Run "vite build" first.');
    process.exit(1);
  }

  const baseTemplate = fs.readFileSync(indexHtmlPath, 'utf8');
  let generatedCount = 0;

  for (const lang of langs) {
    for (const tool of tools) {
      const toolDir = path.join(distDir, lang, tool);
      fs.mkdirSync(toolDir, { recursive: true });

      const localizedHtml = buildPrerenderedHTML(baseTemplate, lang, tool);
      fs.writeFileSync(path.join(toolDir, 'index.html'), localizedHtml, 'utf8');
      generatedCount++;
    }

    // Also create language root: dist/{lang}/index.html (equivalent to dist/{lang}/home/index.html)
    const langDir = path.join(distDir, lang);
    const langHomeHtml = buildPrerenderedHTML(baseTemplate, lang, 'home');
    fs.writeFileSync(path.join(langDir, 'index.html'), langHomeHtml, 'utf8');
  }

  console.log(`[SSG Prerender] Successfully generated ${generatedCount} static route HTML pages with unique canonicals, meta, hreflangs, and structured content!`);
}

main();
