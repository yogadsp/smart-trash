# Smart Trash

Web yang digunakan untuk monitoring kondisi tempat sampah dan juga terdapat Amazon Image Rekognition untuk klasifikasi sampah berdasarkan citra serta mengirim push notification ke aplikasi Android ketika tempat sampah dalam keadaan penuh.

### Konfigurasi
+ Ubah file credentials.json untuk menggunakan Amazon Image Rekognition.
+ Ubah konfigurasi MQTT Broker pada file routes/index.js line 29 (gunakan MQTT broker gratis untuk uji coba contohnya flespi.io)
+ Ubah URL Firebase pada file routes/index.js line 311
+ Ubah token sebagai penerima push notification pada file routes/index.js line 317

#### Kontak
Jika ada hal yang ditanyakan hubungi yogaseptana(at)gmail(dot)com dengan Subjek "Smart Trash"
