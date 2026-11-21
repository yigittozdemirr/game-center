const S = { games: [], nav: 'all', q: '', genre: '', publisher: '', sort: 'name', detail: null, editing: false, featured: 0, opened: null, cfg: null };
const $ = (sel, el = document) => el.querySelector(sel);
const view = $('#view');

// ---------- language ----------
const L = {
  tr: {
    'nav.all': 'Kütüphane', 'nav.fav': 'Favoriler', 'nav.recent': 'Son Oynanan', 'nav.hidden': 'Gizlenenler', 'nav.settings': 'Ayarlar',
    stat: 'oyun kütüphanende', search: 'Oyun, tür ya da şirket ara…  (Ctrl+F)', rescan: 'Oyunları yeniden tara',
    'title.all': 'Tüm oyunlar', 'title.fav': 'Favoriler', 'title.recent': 'Son oynananlar', 'title.hidden': 'Gizlenen oyunlar',
    all: 'Tümü', allCompanies: 'Tüm şirketler', sortName: 'A → Z', sortRecent: 'Son oynanan', sortMost: 'En çok oynanan',
    noMatch: 'Bu filtreye uyan oyun yok.', searching: 'Oyunlar aranıyor…', never: 'Hiç oynanmadı', played: '{0} oynandı',
    play: '▶ Oyna', fav: 'Favori', favOn: 'Favoride', openFolder: 'Klasörü aç', showInSteam: "Steam'de göster", openApp: 'Uygulamayı aç', customize: '✎ Özelleştir', back: '← Kütüphane',
    prev: 'Önceki', next: 'Sonraki', playing: 'Şu an açık',
    total: 'Toplam oynama', twoWeeks: 'Son 2 hafta', lastPlayed: 'Son oynama', platform: 'Platform',
    fromSteam: 'Steam kaydı', fromSteamOnline: 'Steam hesabından', measured: 'Ludora açıkken ölçülür',
    news: 'Haberler ve güncellemeler', 'nav.stats': 'İstatistikler', totalPlay: 'Toplam oynama', last7: 'Son 7 gün', gamesCount: 'Oyun', emuGames: '+ {0} emülatör oyunu',
    completedCount: 'Bitirilen', mostPlayed: 'En çok oynananlar', byPlatform: 'Platformlara göre', last14: 'Son 14 gün', noData: 'Henüz oynama verisi yok.',
    last14Hint: 'Ludora açıkken ölçülen günlük oynama (Steam oyunları dahil).',
    status: 'Durum', st_playing: 'Oynuyorum', st_completed: 'Bitirdim', st_backlog: 'Sırada', st_dropped: 'Bıraktım', st_none: 'Durum yok', allStatuses: 'Tüm durumlar',
    collections: 'Koleksiyonlar', addCollection: 'koleksiyon ekle', allCollections: 'Tüm koleksiyonlar',
    gridSize: 'Sıradaki oyun sayısı', perRow: 'Bir sırada {0} oyun',
    randomPick: 'Ne oynasam?', another: 'Başka', openPage: 'Oyun sayfası',
    set_checkUpdates: "Yeni Ludora sürümlerini denetle (GitHub)", updateBadge: 'Güncelleme: v{0}', updateTitle: 'Ludora {0} hazır', updateCurrent: 'Şu an kullandığın sürüm: {0}',
    updateHint: 'Güncelleme indirilir, kurulur ve Ludora yeniden açılır. Kütüphanen ve ayarların korunur.', updateNow: 'Şimdi güncelle', later: 'Sonra', installing: 'Kuruluyor…',
    E_UPDATE: 'Güncelleme kurulamadı', E_NOUPDATE: 'Yeni sürüm yok',
    phone: 'Telefondan kontrol', phoneOn: 'Telefondan kontrolü aç', phoneOff: 'Açınca telefonundan kütüphaneni görebilir, oyunları bu bilgisayarda başlatabilir ve ekran görüntülerine bakabilirsin. Sadece aynı ev ağındaki ve QR kodu okutan cihazlar bağlanabilir.',
    phoneHint: 'Telefonun bu bilgisayarla aynı Wi-Fi ağında olmalı. Telefonunun kamerasıyla QR kodu okut. Sayfa açılınca tarayıcı menüsünden "Ana ekrana ekle" dersen uygulama gibi açılır.',
    phoneFirewall: 'Windows Güvenlik Duvarı sorarsa "Özel ağlar" için izin ver.', phoneChrome: 'Chrome "bağlantı reddedildi" derse: telefonun Ayarlar > Uygulamalar > Chrome > İzinler bölümünde "Yakındaki cihazlar" iznini aç ya da sayfayı Samsung İnternet gibi başka bir tarayıcıda aç.', phoneReset: 'Eşleşmeyi sıfırla', phoneResetDone: 'Yeni QR kodu oluşturuldu. Telefonlar yeniden okutmalı.', phoneAddr: 'Adres',
    E_PORT: 'Telefon sunucusu başlatılamadı: port kullanımda.', E_NONETWORK: 'Ağ bağlantısı bulunamadı. Bilgisayarı Wi-Fi ya da kabloyla ev ağına bağla.',
    general: 'Genel', set_online: 'Oyun bilgilerini ve görsellerini internetten indir (Steam, Vikipedi, libretro: sadece oyun adları gönderilir)', set_autostart: "Windows açılınca Ludora'yı başlat (tepside)", set_closeToTray: 'Pencereyi kapatınca arka planda (tepside) çalışmaya devam et', set_trayOnLaunch: "Oyun başlayınca Ludora'yı tepsiye küçült",
    uninstall: 'Kaldır', confirmUninstall: '{0} kaldırılsın mı? {1} kaldırma ekranı açılacak.',
    un_steam: "Steam'in kaldırma penceresi açıldı.", un_xbox: "Windows Ayarlar açıldı: oyunun sayfasında Kaldır'a bas.",
    un_epic: "Epic Games açıldı. Kütüphane'de oyunun ••• menüsünden Kaldır'ı seç (Epic doğrudan kaldırma bağlantısı vermiyor).",
    un_registry: 'Oyunun kaldırma programı açıldı.', un_exe: 'Oyunun kaldırma programı açıldı.',
    E_NOUNINSTALL: 'Bu oyunun kaldırma programı bulunamadı. Klasörü açıp elle silebilirsin.',
    playingNow: 'Oynuyor', launchingNow: 'Başlatılıyor…', E_RUNNING: 'Bu oyun zaten açık',
    about: 'Hakkında', wikiSource: "Kaynak: Vikipedi", noDesc: 'Bu oyun için açıklama bulunamadı.', loadingInfo: 'Bilgiler yükleniyor…',
    developer: 'Geliştirici', publisher: 'Yayıncı', release: 'Çıkış tarihi', genres: 'Türler', location: 'Konum',
    displayName: 'Görünen ad', launchPath: 'Başlatma yolu', launchHint: 'Mod yükleyici gibi farklı bir programla açmak için seç.',
    launchDefault: 'Varsayılan', choose: 'Seç…', reset: 'Varsayılan',
    hero: 'Banner', cover: 'Kapak', logo: 'Logo', fromFile: 'Dosyadan', fromUrl: 'Bağlantıdan',
    save: 'Kaydet', redownload: 'Görselleri yeniden indir', hide: 'Kütüphaneden gizle', unhide: 'Kütüphanede göster', close: 'Kapat',
    platforms: 'Platformlar', platformsHint: 'Kurulu oyunlar platformların kendi kayıtlarından okunur. Uygulama açıkken kurduğun ya da kaldırdığın oyunlar otomatik görünür.',
    games: '{0} oyun', game1: '{0} oyun', extra: 'Ek klasörler', optional: '(isteğe bağlı)',
    extraHint: 'Hiçbir platforma bağlı olmayan oyunlar için: bu klasörlerdeki .exe ve kısayollar da eklenir.',
    remove: 'Kaldır', addFolder: '+ Klasör ekle', appearance: 'Görünüm', themeColor: 'Tema rengi', custom: 'Özel',
    language: 'Dil', playtimeHint: 'Steam dışı oyunların süresi, Ludora açıkken oyunun çalıştığı süre ölçülerek tutulur.',
    starting: '{0} başlatılıyor…', saved: 'Kaydedildi', downloading: 'İndiriliyor…', updated: 'Güncellendi',
    hidden: 'Gizlendi (Gizlenenler sekmesinden geri alabilirsin)', shown: 'Kütüphanede gösteriliyor',
    found: '{0} oyun bulundu', newGame: 'Yeni oyun: {0}', imgUrl: 'Görsel bağlantısı (https://…)', cancel: 'Vazgeç', ok: 'Tamam',
    E_NOTFOUND: 'Oyun bulunamadı', E_IMGTYPE: 'Geçersiz görsel türü', E_URL: 'Bağlantı http(s) ile başlamalı', E_DOWNLOAD: 'Görsel indirilemedi',
    min: '{0} dk', hours: '{0} saat',
    'nav.platforms': 'Platformlar', 'nav.emu': 'Emülatörler', 'nav.shots': 'Ekran Görüntüleri',
    fromAccount: 'Hesaptan', connected: 'Bağlı', notConnected: 'Bağlı değil', connect: 'Bağlan', disconnect: 'Bağlantıyı kaldır', syncNow: 'Şimdi eşitle',
    localRead: 'Giriş gerekmez — bilgisayardaki Steam kaydından okunur', lastSync: 'Son eşitleme: {0}', inLibrary: 'Kütüphanede göster',
    xboxHint: 'Xbox girişi için Microsoft\'un ücretsiz Azure portalında oluşturduğun uygulama kimliği (Client ID) gerekir.',
    steamKey: 'Steam Web API anahtarı', steamApiHint: 'İsteğe bağlı: Steam Web API anahtarını eklersen süreler doğrudan Steam hesabından gelir. Steam bilgisayardaki kaydı geç güncellediği için süreler bazen Steam uygulamasından geride kalabilir.',
    steamApiOn: 'Süreler Steam hesabından', steamHowTo: 'Anahtar nasıl alınır?', steamHowToTitle: 'Steam Web API anahtarı alma (bir kerelik)',
    sk1: 'Steam hesabınla giriş yapıp anahtar sayfasını aç:', sk2: '"Domain Name" alanına <b>localhost</b> yaz, koşulları kabul et ve <b>Register</b>’a bas. Steam telefonundan onay isteyebilir.',
    sk3: 'Çıkan <b>Key</b> değerini kopyala, Ludora’da Steam kartındaki alana yapıştır ve <b>Bağlan</b>’a bas.',
    sk4: 'Steam profilinde <b>Gizlilik Ayarları > Oyun ayrıntıları</b> "Herkese açık" olmalı; yoksa Steam süreleri vermez.',
    skNote: 'Anahtar bilgisayarında Windows şifrelemesiyle saklanır ve sadece Steam’e (api.steampowered.com) gönderilir. Steam’e en az 5$ harcamamış hesaplar anahtar alamayabilir.',
    E_STEAM_KEY: 'Steam anahtarı geçersiz. 32 karakterlik anahtarı tam kopyaladığından emin ol.', E_STEAM_PRIVATE: 'Steam süreleri vermedi: profilinde "Oyun ayrıntıları" herkese açık olmalı.',
    E_STEAM_API: "Steam'e ulaşılamadı, daha sonra yeniden denenecek.", E_STEAM_NOUSER: 'Bu bilgisayarda giriş yapılmış bir Steam hesabı bulunamadı.',
    clientId: 'Azure Client ID', epicHint: 'Epic, dışarıdan uygulamalara oynama süresi veren resmi bir giriş sunmuyor. Süre Ludora açıkken ölçülür.',
    localOnly: 'Giriş yok — kurulu oyunlar bilgisayardan okunur, süre Ludora ölçer.',
    E_XBOX_AUTH: 'Xbox girişi başarısız', E_XBOX_NOPROFILE: 'Bu Microsoft hesabının Xbox profili yok', E_XBOX_CHILD: 'Çocuk hesabı: aile ayarlarından izin gerekli',
    E_CLIENTID: 'Geçerli bir Azure Client ID gir', E_LOGIN_CANCEL: 'Giriş iptal edildi', E_HOTKEY: 'Bu tuş kullanılamıyor (başka bir uygulama almış olabilir)',
    E_EMU_MISSING: 'Emülatör programı bulunamadı', E_SHOT: 'Ekran görüntüsü alınamadı',
    steamMatch: 'Steam eşleşmesi (bilgi ve görsellerin kaynağı)', matchAuto: 'otomatik', matchManual: 'elle seçildi', matchNone: 'Eşleşme yok', matchReset: 'Otomatiğe dön',
    steamSearch: "Steam'de oyun adı ara", searchBtn: 'Ara', noResults: 'Sonuç bulunamadı. Farklı bir ad dene (ör. İngilizce tam adı).',
    shots: 'Ekran görüntüleri', shotKey: 'Ekran görüntüsü tuşu', shotDir: 'Kayıt klasörü', pressKey: 'Bir tuşa bas… (Esc: vazgeç)', change: 'Değiştir', open: 'Aç',
    shotsEmpty: 'Henüz ekran görüntüsü yok. Oyundayken {0} tuşuna bas.', showInFolder: 'Klasörde göster', all2: 'Tümünü gör',
    emus: 'Emülatörler', addEmu: '+ Emülatör ekle', editEmu: 'Emülatörü düzenle', emuExe: 'Program', romDir: 'ROM klasörü', args: 'Başlatma argümanları',
    argsHint: '{rom} yerine oyun dosyası gelir.', exts: 'Dosya uzantıları', system: 'Sistem (kapaklar için)', none: '— yok —', edit: 'Düzenle',
    emuEmpty: 'Henüz emülatör eklenmedi. Emülatörün exe dosyasını ve ROM klasörünü seç; oyunlar burada listelenir.', roms: '{0} oyun', pickFolder: 'Klasör seç',
    copy: 'Kopyala', delete: 'Sil', copied: 'Panoya kopyalandı', trashed: "Geri Dönüşüm Kutusu'na taşındı",
    confirmDelete: "Bu ekran görüntüsü silinsin mi? Geri Dönüşüm Kutusu'na taşınır.",
    howTo: 'Client ID nasıl alınır?', howToTitle: "Azure'dan Client ID alma (bir kerelik)",
    az0: 'Kişisel Microsoft hesabıyla doğrudan uygulama kaydı artık açılmıyor ("dizin dışında uygulama oluşturma kullanım dışı" uyarısı). Önce <b>ücretsiz Azure hesabı</b> aç; bu sana bir dizin verir. Kimlik doğrulaması için telefon ve kart ister, ama ücretli plana kendin geçmedikçe para çekilmez:',
    az1: 'Sonra Azure portalındaki uygulama kayıtlarına gir:',
    az2: 'Açılan "App registrations" sayfasında <b>New registration</b>\'a bas.',
    az3: 'Name: <b>Ludora</b> yaz. "Supported account types" bölümünde <b>Personal Microsoft accounts only</b> seç.',
    az4: 'Redirect URI kısmında platform olarak <b>Public client/native (mobile &amp; desktop)</b> seç ve şu adresi yapıştır:',
    az5: '<b>Register</b>\'a bas. Açılan sayfadaki <b>Application (client) ID</b> değerini kopyala, buradaki kutuya yapıştır ve <b>Bağlan</b>\'a bas.',
    azNote: 'Uygulama kaydı ücretsizdir ve bir kez yapılır. Bu kimlik gizli değildir; arkadaşın aynı ID ile kendi Xbox hesabına girebilir, onun Azure hesabı açmasına gerek yok. Kart vermek istemezsen Xbox girişi şart değil: Ludora oynama süresini kendisi ölçmeye devam eder.',
  },
  en: {
    'nav.all': 'Library', 'nav.fav': 'Favorites', 'nav.recent': 'Recently Played', 'nav.hidden': 'Hidden', 'nav.settings': 'Settings',
    stat: 'games in your library', search: 'Search games, genres or companies…  (Ctrl+F)', rescan: 'Rescan games',
    'title.all': 'All games', 'title.fav': 'Favorites', 'title.recent': 'Recently played', 'title.hidden': 'Hidden games',
    all: 'All', allCompanies: 'All companies', sortName: 'A → Z', sortRecent: 'Recently played', sortMost: 'Most played',
    noMatch: 'No games match this filter.', searching: 'Looking for games…', never: 'Never played', played: '{0} played',
    play: '▶ Play', fav: 'Favorite', favOn: 'Favorited', openFolder: 'Open folder', showInSteam: 'Show in Steam', openApp: 'Open app', customize: '✎ Customize', back: '← Library',
    prev: 'Previous', next: 'Next', playing: 'Running now',
    total: 'Total playtime', twoWeeks: 'Last 2 weeks', lastPlayed: 'Last played', platform: 'Platform',
    fromSteam: 'Steam record', fromSteamOnline: 'From your Steam account', measured: 'Measured while Ludora runs',
    news: 'News and updates', 'nav.stats': 'Statistics', totalPlay: 'Total playtime', last7: 'Last 7 days', gamesCount: 'Games', emuGames: '+ {0} emulator games',
    completedCount: 'Completed', mostPlayed: 'Most played', byPlatform: 'By platform', last14: 'Last 14 days', noData: 'No playtime data yet.',
    last14Hint: 'Daily playtime measured while Ludora runs (Steam games included).',
    status: 'Status', st_playing: 'Playing', st_completed: 'Completed', st_backlog: 'Backlog', st_dropped: 'Dropped', st_none: 'No status', allStatuses: 'All statuses',
    collections: 'Collections', addCollection: 'add collection', allCollections: 'All collections',
    gridSize: 'Games per row', perRow: '{0} games per row',
    randomPick: 'What should I play?', another: 'Another', openPage: 'Game page',
    set_checkUpdates: 'Check for new Ludora versions (GitHub)', updateBadge: 'Update: v{0}', updateTitle: 'Ludora {0} is available', updateCurrent: 'You are on version {0}',
    updateHint: 'The update is downloaded and installed, then Ludora restarts. Your library and settings are kept.', updateNow: 'Update now', later: 'Later', installing: 'Installing…',
    E_UPDATE: 'Could not install the update', E_NOUPDATE: 'No new version',
    phone: 'Phone remote', phoneOn: 'Control Ludora from your phone', phoneOff: 'Browse your library, start games on this PC and look at your screenshots from your phone. Only devices on your home network that scanned the QR code can connect.',
    phoneHint: 'Your phone must be on the same Wi-Fi as this PC. Scan the QR code with your phone camera. Once the page opens, choose "Add to Home screen" in the browser menu to open it like an app.',
    phoneFirewall: 'If Windows Firewall asks, allow access on private networks.', phoneChrome: 'If Chrome says "connection refused", allow "Nearby devices" for Chrome in the Settings app of your phone (Apps > Chrome > Permissions), or open the page in another browser.', phoneReset: 'Reset pairing', phoneResetDone: 'New QR code created. Phones need to scan it again.', phoneAddr: 'Address',
    E_PORT: 'Could not start the phone server: the port is in use.', E_NONETWORK: 'No network found. Connect this PC to your home network by Wi-Fi or cable.',
    general: 'General', set_online: 'Download game info and artwork from the internet (Steam, Wikipedia, libretro: only game names are sent)', set_autostart: 'Start Ludora with Windows (in the tray)', set_closeToTray: 'Keep running in the tray when the window is closed', set_trayOnLaunch: 'Minimize Ludora to the tray when a game starts',
    uninstall: 'Uninstall', confirmUninstall: 'Uninstall {0}? The {1} uninstall screen will open.',
    un_steam: "Steam's uninstall window opened.", un_xbox: "Windows Settings opened: click Uninstall on the game's page.",
    un_epic: "Epic Games opened. In Library, pick Uninstall from the game's ••• menu (Epic offers no direct uninstall link).",
    un_registry: "The game's uninstaller opened.", un_exe: "The game's uninstaller opened.",
    E_NOUNINSTALL: 'No uninstaller found for this game. You can open its folder and delete it manually.',
    playingNow: 'Playing', launchingNow: 'Starting…', E_RUNNING: 'This game is already running',
    about: 'About', wikiSource: 'Source: Wikipedia', noDesc: 'No description found for this game.', loadingInfo: 'Loading info…',
    developer: 'Developer', publisher: 'Publisher', release: 'Release date', genres: 'Genres', location: 'Location',
    displayName: 'Display name', launchPath: 'Launch path', launchHint: 'Pick a different program, e.g. a mod loader.',
    launchDefault: 'Default', choose: 'Choose…', reset: 'Default',
    hero: 'Banner', cover: 'Cover', logo: 'Logo', fromFile: 'From file', fromUrl: 'From link',
    save: 'Save', redownload: 'Re-download images', hide: 'Hide from library', unhide: 'Show in library', close: 'Close',
    platforms: 'Platforms', platformsHint: 'Installed games are read from each platform\'s own records. Games you install or remove while the app is open show up automatically.',
    games: '{0} games', game1: '{0} game', extra: 'Extra folders', optional: '(optional)',
    extraHint: 'For games without a platform: .exe files and shortcuts in these folders are added too.',
    remove: 'Remove', addFolder: '+ Add folder', appearance: 'Appearance', themeColor: 'Theme color', custom: 'Custom',
    language: 'Language', playtimeHint: 'For non-Steam games, playtime is measured while Ludora is running.',
    starting: 'Starting {0}…', saved: 'Saved', downloading: 'Downloading…', updated: 'Updated',
    hidden: 'Hidden (undo from the Hidden tab)', shown: 'Shown in library',
    found: '{0} games found', newGame: 'New game: {0}', imgUrl: 'Image link (https://…)', cancel: 'Cancel', ok: 'OK',
    E_NOTFOUND: 'Game not found', E_IMGTYPE: 'Invalid image type', E_URL: 'Link must start with http(s)', E_DOWNLOAD: 'Could not download image',
    min: '{0} min', hours: '{0} h',
    'nav.platforms': 'Platforms', 'nav.emu': 'Emulators', 'nav.shots': 'Screenshots',
    fromAccount: 'From account', connected: 'Connected', notConnected: 'Not connected', connect: 'Connect', disconnect: 'Disconnect', syncNow: 'Sync now',
    localRead: 'No sign-in needed — read from Steam\'s files on this PC', lastSync: 'Last sync: {0}', inLibrary: 'Show in library',
    xboxHint: 'Xbox sign-in needs an app ID (Client ID) you create for free in Microsoft\'s Azure portal.',
    steamKey: 'Steam Web API key', steamApiHint: 'Optional: add a Steam Web API key and playtimes come straight from your Steam account. Steam updates the file on this PC late, so playtimes can otherwise lag behind the Steam app.',
    steamApiOn: 'Playtimes from your Steam account', steamHowTo: 'How do I get a key?', steamHowToTitle: 'Getting a Steam Web API key (one-time)',
    sk1: 'Sign in with your Steam account and open the key page:', sk2: 'Enter <b>localhost</b> as "Domain Name", accept the terms and click <b>Register</b>. Steam may ask you to confirm on your phone.',
    sk3: 'Copy the <b>Key</b>, paste it into the Steam card in Ludora and click <b>Connect</b>.',
    sk4: 'In your Steam profile, <b>Privacy Settings > Game details</b> must be "Public", otherwise Steam doesn’t share playtimes.',
    skNote: 'The key is stored on this PC with Windows encryption and only sent to Steam (api.steampowered.com). Accounts that haven’t spent $5 on Steam may not be able to get a key.',
    E_STEAM_KEY: 'The Steam key is not valid. Make sure you copied the whole 32-character key.', E_STEAM_PRIVATE: 'Steam didn’t share playtimes: "Game details" must be public in your profile.',
    E_STEAM_API: "Couldn't reach Steam, Ludora will try again later.", E_STEAM_NOUSER: 'No signed-in Steam account found on this PC.',
    clientId: 'Azure Client ID', epicHint: 'Epic offers no official sign-in that gives playtime to third-party apps. Playtime is measured while Ludora runs.',
    localOnly: 'No sign-in — installed games are read from this PC, Ludora measures playtime.',
    E_XBOX_AUTH: 'Xbox sign-in failed', E_XBOX_NOPROFILE: 'This Microsoft account has no Xbox profile', E_XBOX_CHILD: 'Child account: needs permission in family settings',
    E_CLIENTID: 'Enter a valid Azure Client ID', E_LOGIN_CANCEL: 'Sign-in cancelled', E_HOTKEY: 'This key can\'t be used (another app may own it)',
    E_EMU_MISSING: 'Emulator program not found', E_SHOT: 'Could not take screenshot',
    steamMatch: 'Steam match (source of info and images)', matchAuto: 'automatic', matchManual: 'picked manually', matchNone: 'No match', matchReset: 'Back to automatic',
    steamSearch: 'Search Steam by game name', searchBtn: 'Search', noResults: 'No results. Try another name (e.g. the full English title).',
    shots: 'Screenshots', shotKey: 'Screenshot key', shotDir: 'Save folder', pressKey: 'Press a key… (Esc: cancel)', change: 'Change', open: 'Open',
    shotsEmpty: 'No screenshots yet. Press {0} while playing.', showInFolder: 'Show in folder', all2: 'See all',
    emus: 'Emulators', addEmu: '+ Add emulator', editEmu: 'Edit emulator', emuExe: 'Program', romDir: 'ROM folder', args: 'Launch arguments',
    argsHint: '{rom} is replaced with the game file.', exts: 'File extensions', system: 'System (for covers)', none: '— none —', edit: 'Edit',
    emuEmpty: 'No emulators yet. Pick the emulator\'s exe and your ROM folder; games show up here.', roms: '{0} games', pickFolder: 'Pick folder',
    copy: 'Copy', delete: 'Delete', copied: 'Copied to clipboard', trashed: 'Moved to the Recycle Bin',
    confirmDelete: 'Delete this screenshot? It will be moved to the Recycle Bin.',
    howTo: 'How do I get a Client ID?', howToTitle: 'Getting a Client ID from Azure (one-time)',
    az0: 'Personal Microsoft accounts can no longer register apps directly (the "creating applications outside of a directory has been deprecated" warning). First open a <b>free Azure account</b>, which gives you a directory. It asks for a phone and card to verify your identity, but nothing is charged unless you upgrade to a paid plan yourself:',
    az1: 'Then open App registrations in the Azure portal:',
    az2: 'On the "App registrations" page, click <b>New registration</b>.',
    az3: 'Name: <b>Ludora</b>. Under "Supported account types" choose <b>Personal Microsoft accounts only</b>.',
    az4: 'Under Redirect URI pick <b>Public client/native (mobile &amp; desktop)</b> and paste this address:',
    az5: 'Click <b>Register</b>. Copy the <b>Application (client) ID</b> shown, paste it into the box here and click <b>Connect</b>.',
    azNote: 'Registering the app is free and done once. The ID isn\'t a secret; a friend can sign in to their own Xbox account with the same ID without making an Azure account. If you\'d rather not give a card, Xbox sign-in is optional: Ludora keeps measuring playtime itself.',
  },
};
let lang = 'tr';
const t = (k, ...a) => (L[lang][k] ?? L.tr[k] ?? k).replace(/\{(\d)\}/g, (_, i) => a[i]);
const locale = () => (lang === 'en' ? 'en' : 'tr');

function applyStatic() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  document.querySelectorAll('[data-i18n-title]').forEach((el) => (el.title = t(el.dataset.i18nTitle)));
  document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
}
function applyTheme() {
  document.documentElement.style.setProperty('--accent', S.cfg?.accent || '#e8293b');
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const decode = (s) => new DOMParser().parseFromString(s || '', 'text/html').body.textContent; // &quot; etc. in Steam text
const low = (s) => String(s || '').toLocaleLowerCase(locale());
const SOURCE = { steam: 'Steam', epic: 'Epic Games', xbox: 'Xbox', ea: 'EA app', ubisoft: 'Ubisoft Connect', gog: 'GOG', shortcut: 'Shortcut' };
const srcName = (g) => (g.source === 'emu' ? g.emuName : g.source === 'shortcut' ? (lang === 'en' ? 'Shortcut' : 'Kısayol') : SOURCE[g.source]);
// emulator games live in their own tab, not the main library
// The tab's games; genre chips and the company list are counted from these too (only favorites in Favorites)
const inNav = (g) => {
  if (S.nav === 'hidden') return g.hidden;
  if (g.hidden) return false;
  if (S.nav === 'fav') return g.favorite;
  if (S.nav === 'recent') return !!g.lastPlayed;
  return g.source !== 'emu'; // emulator games are in their own tab
};
function ago(ts) {
  if (!ts) return t('never');
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
  const m = (ts - Date.now()) / 60000;
  const units = [['minute', 1, 60], ['hour', 60, 24], ['day', 1440, 30], ['month', 43200, 12]];
  for (const [u, size, max] of units) if (Math.abs(m / size) < max) return rtf.format(Math.round(m / size), u);
  return rtf.format(Math.round(m / 525600), 'year');
}
const hours = (min) => (!min ? '' : min < 60 ? t('min', min) : t('hours', new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(min / 60)));

function toast(msg, bad, ms = 3000) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.className = ''), ms);
}
const safe = (fn) => async (...a) => {
  try { return await fn(...a); } catch (e) { toast(t(String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '')), true); }
};

// Transitions started by the user are smooth (View Transitions); background updates are silent.
// kind='hero': only the showcase changes, the rest of the page stays put.
// No transition while a popup is open (What should I play?, image viewer, info box, confirm): the effect snapshots
// the whole page, so the popup flickered
const overlayOpen = () => !!document.querySelector('.modal, .lightbox');
function go(fn, kind = 'page') {
  if (!document.startViewTransition || overlayOpen() || matchMedia('(prefers-reduced-motion: reduce)').matches) return fn();
  document.documentElement.dataset.vt = kind;
  document.startViewTransition(fn).finished.finally(() => delete document.documentElement.dataset.vt);
}

const colorVars = (g) => {
  const c = g?.colors || {};
  return `--c1:${c.primary || 'var(--accent)'};--c2:${c.secondary || 'color-mix(in srgb, var(--accent) 40%, #000)'};--c3:${c.average || '#1a1b22'}`;
};
function setAmbient(g) {
  const a = $('#ambient');
  a.setAttribute('style', colorVars(g));
  a.classList.toggle('on', !!g?.colors);
}

// ---------- filtering ----------
function visible() {
  let l = S.games.filter(inNav);
  const q = low(S.q).trim();
  if (q) l = l.filter((g) => [g.name, g.publisher, g.developer, srcName(g), ...g.genres].some((x) => low(x).includes(q)));
  if (S.genre) l = l.filter((g) => g.genres.includes(S.genre));
  if (S.publisher) l = l.filter((g) => g.publisher === S.publisher);
  if (S.status) l = l.filter((g) => (S.status === 'none' ? !g.status : g.status === S.status));
  if (S.collection) l = l.filter((g) => g.collections.includes(S.collection));
  const sort = S.nav === 'recent' ? 'recent' : S.sort;
  const byName = (a, b) => a.name.localeCompare(b.name, locale());
  const by = {
    name: byName,
    recent: (a, b) => b.lastPlayed - a.lastPlayed || byName(a, b),
    most: (a, b) => b.playtime - a.playtime || byName(a, b),
  }[sort];
  return l.sort(by);
}

function counts(list, pickFn) {
  const m = new Map();
  for (const g of list) for (const v of [].concat(pickFn(g))) if (v) m.set(v, (m.get(v) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale()));
}

function featuredList() {
  const l = S.games.filter((g) => !g.hidden && g.images.hero && g.source !== 'emu');
  const played = l.filter((g) => g.lastPlayed || g.favorite).sort((a, b) => b.favorite - a.favorite || b.lastPlayed - a.lastPlayed);
  return (played.length >= 3 ? played : [...played, ...l.filter((g) => !played.includes(g))]).slice(0, 6);
}

// ---------- pieces ----------
const chips = (genres, cls = '') => genres.slice(0, 4).map((x) => `<span class="chip ${cls}">${esc(x)}</span>`).join('');

function cover(g) {
  const img = g.images.cover || g.images.hero;
  return img
    ? `<img src="${esc(img)}" alt="" loading="lazy" class="${g.images.cover ? '' : 'crop'}">`
    : `<div class="cover-fallback">${g.images.icon ? `<img src="${esc(g.images.icon)}" alt="">` : ''}<span>${esc(g.name)}</span></div>`;
}

function card(g) {
  const vt = S.opened === g.key ? 'view-transition-name:banner;' : '';
  return `<div class="card${g.loading ? ' loading' : ''}${g.running ? ' running' : ''}" data-open="${esc(g.key)}" style="${vt}${colorVars(g)}" tabindex="0">
    ${cover(g)}
    <button class="card-fav${g.favorite ? ' on' : ''}" data-fav="${esc(g.key)}" title="${t('fav')}">★</button>
    ${playBtn(g, 'card-play', '▶')}
    <div class="card-info"><b>${esc(g.name)}</b><small>${esc(hours(g.playtime) || g.publisher || srcName(g))}</small></div>
  </div>`;
}

// ---------- statistics ----------
// One series, one color (theme color); values are written next to the bars, details on hover
function renderStats() {
  setAmbient(null);
  const games = S.games.filter((g) => !g.hidden);
  const total = games.reduce((a, g) => a + g.playtime, 0);
  const top = games.filter((g) => g.playtime > 0).sort((a, b) => b.playtime - a.playtime).slice(0, 8);
  const plat = new Map();
  for (const g of games) if (g.playtime) plat.set(srcName(g), (plat.get(srcName(g)) || 0) + g.playtime);
  const platList = [...plat].sort((a, b) => b[1] - a[1]);
  const dayKey = (ms) => new Date(ms).toLocaleDateString('sv');
  const days = Array.from({ length: 14 }, (_, i) => {
    const ms = Date.now() - (13 - i) * 864e5;
    const k = dayKey(ms);
    return { ms, min: Math.round(games.reduce((a, g) => a + (g.days?.[k] || 0), 0) / 60000) };
  });
  const week = days.slice(7).reduce((a, d) => a + d.min, 0);
  const maxDay = Math.max(1, ...days.map((d) => d.min));
  const dayFmt = new Intl.DateTimeFormat(locale(), { weekday: 'short', day: 'numeric' });
  const longFmt = new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
  const statusCount = (st) => games.filter((g) => g.status === st).length;
  const hbars = (rows, max) => rows.map(([label, min, key]) => `<button class="hbar"${key ? ` data-open="${esc(key)}"` : ''} data-tip="${esc(label)}: ${esc(hours(min))}">
      <span class="hb-label">${esc(label)}</span><span class="hb-track"><span class="hb-fill" style="width:${Math.max(1.5, (min / max) * 100)}%"></span></span><span class="hb-val">${esc(hours(min))}</span>
    </button>`).join('');
  view.innerHTML = `<div class="home stats-page">
    <div class="section-head"><h2>${t('nav.stats')}</h2></div>
    <div class="tiles">
      <div class="tile"><span>${t('totalPlay')}</span><b>${esc(hours(total) || '0')}</b></div>
      <div class="tile"><span>${t('last7')}</span><b>${esc(hours(week) || '0')}</b></div>
      <div class="tile"><span>${t('gamesCount')}</span><b>${games.filter((g) => g.source !== 'emu').length}</b><small>${t('emuGames', games.filter((g) => g.source === 'emu').length)}</small></div>
      <div class="tile"><span>${t('completedCount')}</span><b>${statusCount('completed')}</b><small>${t('st_playing')}: ${statusCount('playing')} · ${t('st_backlog')}: ${statusCount('backlog')}</small></div>
    </div>
    <div class="stats-grid">
      <section class="panel">
        <h3>${t('mostPlayed')}</h3>
        ${top.length ? `<div class="hbars">${hbars(top.map((g) => [g.name, g.playtime, g.key]), top[0].playtime)}</div>` : `<p class="muted">${t('noData')}</p>`}
      </section>
      <section class="panel">
        <h3>${t('byPlatform')}</h3>
        ${platList.length ? `<div class="hbars">${hbars(platList.map(([n, m]) => [n, m]), platList[0][1])}</div>` : `<p class="muted">${t('noData')}</p>`}
      </section>
    </div>
    <section class="panel">
      <h3>${t('last14')}</h3>
      <p class="muted small">${t('last14Hint')}</p>
      <div class="cols" role="img" aria-label="${esc(t('last14'))}">
        ${days.map((d) => `<div class="col" data-tip="${esc(longFmt.format(d.ms))}: ${esc(hours(d.min) || '0')}">
          ${d.min === maxDay && d.min > 0 ? `<em>${esc(hours(d.min))}</em>` : ''}
          <span class="col-fill${d.min ? '' : ' zero'}" style="height:${d.min ? Math.max(3, (d.min / maxDay) * 100) : 0}%"></span>
          <small>${esc(dayFmt.format(d.ms))}</small>
        </div>`).join('')}
      </div>
    </section>
  </div>`;
}

// Simple tooltip: shown when hovering any element with data-tip
const tip = document.createElement('div');
tip.id = 'tip';
document.body.append(tip);
document.addEventListener('mousemove', (e) => {
  const el = e.target.closest?.('[data-tip]');
  if (!el) { tip.classList.remove('show'); return; }
  tip.textContent = el.dataset.tip;
  tip.classList.add('show');
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8);
  tip.style.transform = `translate(${x}px, ${e.clientY + 16}px)`;
});

// Games per row in the library: 4 / 6 / 8 (remembered on this PC)
S.cols = (() => { try { return [4, 6, 8].includes(+localStorage.getItem('gridCols')) ? +localStorage.getItem('gridCols') : 6; } catch { return 6; } })();
function colsPicker() {
  const icon = (n) => { // small squares in 2 rows representing n columns
    const c = n / 2, w = 16 / c;
    return `<svg viewBox="0 0 16 12" width="16" height="12">${Array.from({ length: n }, (_, i) => `<rect x="${(i % c) * w + 0.5}" y="${Math.floor(i / c) * 6.5}" width="${w - 1.5}" height="5.5" rx="1"/>`).join('')}</svg>`;
  };
  return `<div class="cols-pick" role="group" aria-label="${t('gridSize')}">${[4, 6, 8].map((n) => `<button class="${S.cols === n ? 'on' : ''}" data-cols="${n}" title="${t('perRow', n)}">${icon(n)}</button>`).join('')}</div>`;
}

// Game statuses and the user's own collections
const STATUSES = ['playing', 'completed', 'backlog', 'dropped'];
const allCollections = () => [...new Set(S.games.flatMap((g) => g.collections))].sort((a, b) => a.localeCompare(b, locale()));
const setCollections = safe(async (key, list) => { refresh(await gc.update(key, { collections: list })); });

// "What should I play?": a random game that isn't running, from the visible list (filters included)
function randomPick(exclude) {
  const pool = visible().filter((g) => !g.running && g.key !== exclude);
  if (!pool.length) return;
  const g = pool[Math.floor(Math.random() * pool.length)];
  document.querySelector('.modal.pick')?.remove();
  const d = document.createElement('div');
  d.className = 'modal pick';
  d.innerHTML = `<div class="pick-card" style="${colorVars(g)}">
    <div class="pick-cover">${cover(g)}</div>
    <div class="pick-body">
      <small>🎲 ${t('randomPick')}</small>
      <h2>${esc(g.name)}</h2>
      <div class="d-chips">${chips(g.genres)}</div>
      <p class="muted">${esc([srcName(g), hours(g.playtime) && t('played', hours(g.playtime)), g.lastPlayed ? ago(g.lastPlayed) : t('never')].filter(Boolean).join(' · '))}</p>
      <div class="pick-actions">
        <button class="btn-play" data-p="play">${t('play')}</button>
        <button class="btn-glass" data-p="open">${t('openPage')}</button>
        <button class="btn-glass" data-p="again">🎲 ${t('another')}</button>
      </div>
    </div>
  </div>`;
  const close = () => { d.remove(); document.removeEventListener('keydown', key, true); };
  const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  d.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('[data-p]');
    if (!b) { if (e.target === d) close(); return; }
    close();
    if (b.dataset.p === 'play') act.play(g.key);
    if (b.dataset.p === 'open') act.open(g.key);
    if (b.dataset.p === 'again') randomPick(g.key);
  });
  document.addEventListener('keydown', key, true);
  document.body.append(d);
}

// Official Steam announcements on the game page (loaded on first open, kept for the session)
S.news = {};
function newsBlock(g) {
  const id = g.steamAppId;
  if (!id || g.source === 'emu') return '';
  const items = S.news[id];
  if (items === undefined) {
    S.news[id] = null; // loading
    gc.steamNews(id).then((list) => { S.news[id] = list; if (S.detail === g.key && !S.editing) render(); });
    return '';
  }
  if (!items || !items.length) return '';
  const fmt = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', year: 'numeric' });
  return `<div class="d-news">
    <div class="section-head"><h3>${t('news')}</h3></div>
    <div class="news-list">${items.slice(0, 4).map((n) => `<a class="news" href="${esc(n.url)}" target="_blank">
      <small>${esc(fmt.format(n.date))}</small><b>${esc(n.title)}</b><p>${esc(n.text)}</p>
    </a>`).join('')}</div>
  </div>`;
}

// Play button: "Playing" while running, "Starting…" while launching (can't be launched twice)
function playBtn(g, cls, label = t('play')) {
  // on cards the usual ▶ stays, just disabled (the green dot at the top of the card already shows it's running)
  if (cls === 'card-play' && (g.running || g.launching)) return `<button class="card-play" disabled title="${t(g.running ? 'playingNow' : 'launchingNow')}">${label}</button>`;
  if (g.running) return `<button class="${cls} playing" disabled title="${t('playingNow')}">${cls === 'card-play' ? '●' : `● ${t('playingNow')}`}</button>`;
  if (g.launching) return `<button class="${cls} starting" disabled title="${t('launchingNow')}">${cls === 'card-play' ? '…' : t('launchingNow')}</button>`;
  return `<button class="${cls}" data-play="${esc(g.key)}" title="${t('play')}">${label}</button>`;
}

const ARROW = (d) => `<svg viewBox="0 0 24 24"><path d="${d < 0 ? 'M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12l8.8-8.8z' : 'm8.6 4.6 7.4 7.4-7.4 7.4 1.4 1.4 8.8-8.8L10 3.2z'}"/></svg>`;

function heroBlock() {
  const list = featuredList();
  if (!list.length) return '';
  const i = ((S.featured % list.length) + list.length) % list.length;
  const g = list[i];
  const thumbs = [1, 2].map((k) => list[(i + k) % list.length]).filter((x, k, a) => x !== g && a.indexOf(x) === k);
  setAmbient(g);
  const stats = [g.running ? t('playing') : ago(g.lastPlayed), hours(g.playtime) && t('played', hours(g.playtime))].filter(Boolean);
  return `<div class="hero-row" style="${colorVars(g)}">
    <div class="hero" data-open="${esc(g.key)}">
      <img class="hero-img" src="${esc(g.images.hero)}" alt="">
      <div class="hero-tags">${chips(g.genres, 'glass')}</div>
      ${g.images.logo ? `<img class="hero-logo" src="${esc(g.images.logo)}" alt="${esc(g.name)}">` : `<h1 class="hero-title">${esc(g.name)}</h1>`}
      <div class="hero-foot">${stats.map((x) => `<span class="chip glass">${esc(x)}</span>`).join('')}</div>
      ${list.length > 1 ? `<button class="hero-nav prev" data-step="-1" title="${t('prev')}">${ARROW(-1)}</button><button class="hero-nav next" data-step="1" title="${t('next')}">${ARROW(1)}</button>` : ''}
    </div>
    <div class="side">
      <div class="feature-card">
        <h2>${esc(g.name)}</h2>
        <p>${esc(decode(g.description))}</p>
        <div class="feature-meta">${esc([g.publisher, g.releaseDate].filter(Boolean).join(' · '))}</div>
        <div class="feature-actions">${playBtn(g, 'btn-play')}<span class="src">${esc(srcName(g))}</span></div>
      </div>
      <div class="thumbs">${thumbs.map((x) => `<button class="thumb" data-feature="${list.indexOf(x)}"><img src="${esc(x.images.hero)}" alt="${esc(x.name)}"></button>`).join('')}</div>
    </div>
  </div>
  <div class="dots">${list.map((_, k) => `<button class="${k === i ? 'on' : ''}" data-feature="${k}"></button>`).join('')}</div>`;
}

function filtersBlock(base) {
  const genres = counts(base, (g) => g.genres);
  const pubs = counts(base, (g) => g.publisher);
  const cols = counts(base, (g) => g.collections);
  const opt = (v, label) => `<option value="${v}"${S.sort === v ? ' selected' : ''}>${label}</option>`;
  return `<div class="filters">
    <div class="chips-row">
      <button class="chip pick${S.genre ? '' : ' on'}" data-genre="">${t('all')}</button>
      ${genres.map(([x, n]) => `<button class="chip pick${S.genre === x ? ' on' : ''}" data-genre="${esc(x)}">${esc(x)} <i>${n}</i></button>`).join('')}
    </div>
    <div class="selects">
      <select id="f-status"><option value="">${t('allStatuses')}</option>${STATUSES.map((x) => `<option value="${x}"${S.status === x ? ' selected' : ''}>${t('st_' + x)}</option>`).join('')}<option value="none"${S.status === 'none' ? ' selected' : ''}>${t('st_none')}</option></select>
      ${cols.length ? `<select id="f-col"><option value="">${t('allCollections')}</option>${cols.map(([x, n]) => `<option value="${esc(x)}"${S.collection === x ? ' selected' : ''}>${esc(x)} (${n})</option>`).join('')}</select>` : ''}
      <select id="f-pub"><option value="">${t('allCompanies')}</option>${pubs.map(([x, n]) => `<option value="${esc(x)}"${S.publisher === x ? ' selected' : ''}>${esc(x)} (${n})</option>`).join('')}</select>
      ${S.nav === 'recent' ? '' : `<select id="f-sort">${opt('name', t('sortName'))}${opt('recent', t('sortRecent'))}${opt('most', t('sortMost'))}</select>`}
    </div>
  </div>`;
}

function renderHome() {
  const base = S.games.filter(inNav);
  const list = visible();
  const showHero = S.nav === 'all' && !S.q && !S.genre && !S.publisher;
  if (!showHero) setAmbient(null);
  view.innerHTML = `<div class="home">
    ${showHero ? heroBlock() : ''}
    ${filtersBlock(base)}
    <div class="section-head"><h3>${t('title.' + S.nav)} <span>${list.length}</span></h3><div class="head-tools">${colsPicker()}${list.length > 1 ? `<button class="btn-glass dice" data-random>🎲 ${t('randomPick')}</button>` : ''}</div></div>
    ${list.length ? `<div class="grid" style="--cols:${S.cols}">${list.map(card).join('')}</div>` : `<div class="empty">${S.games.length ? t('noMatch') : t('searching')}</div>`}
  </div>`;
}

function renderDetail() {
  const g = S.games.find((x) => x.key === S.detail);
  if (!g) { S.detail = null; return renderHome(); }
  setAmbient(g);
  const row = (k, v) => (v ? `<div class="row"><span>${t(k)}</span><b>${esc(v)}</b></div>` : '');
  const how = { steam: t('fromSteam'), steamOnline: t('fromSteamOnline'), account: t('fromAccount'), tracked: t('measured') }[g.timeSource];
  const shots = (S.shots || []).find((x) => x.folder === g.shotFolder)?.files || [];
  view.innerHTML = `<div class="detail" style="${colorVars(g)}">
    <div class="d-hero">
      ${g.images.hero ? `<img class="d-hero-img" src="${esc(g.images.hero)}" alt="">`
        : g.images.cover ? `<div class="d-hero-img from-cover"><img class="blur" src="${esc(g.images.cover)}" alt=""><img class="side" src="${esc(g.images.cover)}" alt=""></div>` // no banner: build one from the cover
        : '<div class="d-hero-img empty"></div>'}
      <button class="back" data-back>← ${t('nav.' + S.nav)}</button>
      <div class="d-hero-content">
        ${g.images.logo ? `<img class="d-logo" src="${esc(g.images.logo)}" alt="${esc(g.name)}">` : `<h1>${esc(g.name)}</h1>`}
        <div class="d-chips">${chips(g.genres, 'glass')}</div>
        <div class="d-actions">
          ${playBtn(g, 'btn-play big')}
          <button class="btn-glass${g.favorite ? ' on' : ''}" data-fav="${esc(g.key)}">★ ${g.favorite ? t('favOn') : t('fav')}</button>
          ${g.source === 'steam' && g.steamAppId ? `<button class="btn-glass" data-steam-show="${esc(g.key)}">${t('showInSteam')}</button>` : ''}
          <button class="btn-glass" data-folder="${esc(g.key)}">${t('openFolder')}</button>
          ${g.source === 'emu' ? '' : `<button class="btn-glass danger" data-uninstall="${esc(g.key)}">${t('uninstall')}</button>`}
          <button class="btn-glass" data-edit>${t('customize')}</button>
        </div>
      </div>
    </div>
    <div class="d-stats">
      <div><b>${esc(hours(g.playtime) || '—')}</b><span>${t('total')} · ${how}</span></div>
      <div><b>${esc(hours(g.playtime2wks) || '—')}</b><span>${t('twoWeeks')}</span></div>
      <div><b>${esc(g.running ? t('playing') : ago(g.lastPlayed))}</b><span>${t('lastPlayed')}</span></div>
      <div><b>${esc(srcName(g))}</b><span>${t('platform')}</span></div>
    </div>
    <div class="d-body">
      <div class="d-main">
        <h3>${t('about')}</h3>
        <p>${esc(decode(g.description)) || `<i class="muted">${t('noDesc')}</i>`}</p>
        ${g.wikiUrl ? `<a class="src-link" href="${esc(g.wikiUrl)}" target="_blank">${t('wikiSource')} ↗</a>` : ''}
        ${g.loading ? `<p class="muted">${t('loadingInfo')}</p>` : ''}
      </div>
      <aside class="d-info">
        <div class="row status-row"><span>${t('status')}</span><select id="d-status"><option value="">${t('st_none')}</option>${STATUSES.map((x) => `<option value="${x}"${g.status === x ? ' selected' : ''}>${t('st_' + x)}</option>`).join('')}</select></div>
        <div class="row col-row"><span>${t('collections')}</span><div class="col-chips">${g.collections.map((c) => `<span class="chip col">${esc(c)}<button data-col-rm="${esc(c)}" title="${t('remove')}">×</button></span>`).join('')}<input id="col-new" list="col-list" placeholder="+ ${t('addCollection')}" maxlength="40"><datalist id="col-list">${allCollections().filter((c) => !g.collections.includes(c)).map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div></div>
        ${row('developer', g.developer)}${row('publisher', g.publisher)}${row('release', g.releaseDate)}
        ${row('genres', g.genres.join(', '))}${row('location', g.installDir)}
      </aside>
    </div>
    ${newsBlock(g)}
    ${shots.length ? `<div class="d-shots">
      <div class="section-head"><h3>${t('shots')} <span>${shots.length}</span></h3><button class="link-btn" data-shot-goto="${esc(g.shotFolder)}">${t('all2')} →</button></div>
      <div class="shot-strip">${shots.slice(0, 8).map((f) => `<button class="shot" data-shot="${esc(f.path)}"><img src="${esc(f.url)}" alt="" loading="lazy"></button>`).join('')}</div>
    </div>` : ''}
    <form class="d-edit${S.editing ? ' open' : ''}" id="edit">
      <h3>${t('customize').replace('✎ ', '')}</h3>
      <div class="edit-row">
        <label class="name-field">${t('displayName')}<input name="name" value="${esc(g.customName)}" placeholder="${esc(g.name)}"></label>
        <div class="launch-field">
          <span>${t('launchPath')}</span>
          <div class="launch-box">
            <code title="${esc(g.customLaunch || g.defaultLaunch)}">${esc(g.customLaunch || `${t('launchDefault')} · ${srcName(g)}`)}</code>
            <button type="button" data-launch-pick>${t('choose')}</button>
            ${g.customLaunch ? `<button type="button" data-launch-reset>${t('reset')}</button>` : ''}
          </div>
          <small class="muted">${t('launchHint')}</small>
        </div>
      </div>
      ${g.source === 'emu' ? '' : `<div class="steam-match">
        <span>${t('steamMatch')}</span>
        <div class="match-now">
          ${g.steamTitle ? `<b>${esc(g.steamTitle)}</b><small class="muted">#${esc(g.steamAppId)} · ${g.steamManual ? t('matchManual') : t('matchAuto')}</small>` : `<b class="muted">${t('matchNone')}</b>`}
          ${g.steamManual ? `<button type="button" class="link-btn" data-steam-reset>${t('matchReset')}</button>` : ''}
        </div>
        <div class="launch-box">
          <input id="steam-q" value="${esc(S.steamQ ?? g.name)}" placeholder="${t('steamSearch')}" spellcheck="false">
          <button type="button" data-steam-search>${t('searchBtn')}</button>
        </div>
        ${S.steamResults ? (S.steamResults.length ? `<div class="steam-results">${S.steamResults.map((r) => `<button type="button" class="steam-hit${r.id === g.steamAppId ? ' on' : ''}" data-steam-pick="${esc(r.id)}">
          ${r.image ? `<img src="${esc(r.image)}" alt="">` : '<span></span>'}<b>${esc(r.name)}</b><small>#${esc(r.id)}</small>
        </button>`).join('')}</div>` : `<p class="muted">${t('noResults')}</p>`) : ''}
      </div>`}
      <div class="img-edit">
        ${['hero', 'cover', 'logo'].map((k) => `<div class="img-slot">
          <span>${t(k)}</span>
          <div class="img-prev ${k}">${g.images[k] ? `<img src="${esc(g.images[k])}" alt="">` : '—'}</div>
          <div class="img-btns"><button type="button" data-img="${k}">${t('fromFile')}</button><button type="button" data-img-url="${k}">${t('fromUrl')}</button>${g.customImages.includes(k) ? `<button type="button" data-img-reset="${k}">${t('reset')}</button>` : ''}</div>
        </div>`).join('')}
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-play">${t('save')}</button>
        <button type="button" class="btn-glass" data-refetch>${t('redownload')}</button>
        <button type="button" class="btn-glass" data-hide>${g.hidden ? t('unhide') : t('hide')}</button>
        <button type="button" class="btn-glass" data-edit>${t('close')}</button>
      </div>
    </form>
  </div>`;
}

const PLATFORMS = ['steam', 'epic', 'xbox', 'ea', 'ubisoft', 'gog'];
const SWATCHES = ['#e8293b', '#ff6a2b', '#f5a524', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];
function renderSettings() {
  setAmbient(null);
  const cfg = S.cfg;
  view.innerHTML = `<div class="settings">
    <h2>${t('nav.settings')}</h2>
    <section>
      <h3>${t('appearance')}</h3>
      <div class="set-row"><span>${t('themeColor')}</span>
        <div class="swatches">
          ${SWATCHES.map((c) => `<button class="swatch${cfg.accent === c ? ' on' : ''}" data-accent="${c}" style="--sw:${c}" title="${c}"></button>`).join('')}
          <label class="swatch custom${SWATCHES.includes(cfg.accent) ? '' : ' on'}" style="--sw:${esc(cfg.accent)}" title="${t('custom')}"><input type="color" id="accent-custom" value="${esc(cfg.accent)}"></label>
        </div>
      </div>
      <div class="set-row"><span>${t('language')}</span>
        <div class="lang inline"><button data-lang="tr" class="${lang === 'tr' ? 'on' : ''}">Türkçe</button><button data-lang="en" class="${lang === 'en' ? 'on' : ''}">English</button></div>
      </div>
    </section>
    <section>
      <h3>${t('general')}</h3>
      ${[['online', true], ['checkUpdates', true], ['autostart', false], ['closeToTray', true], ['trayOnLaunch', true]].map(([k, def]) => `<label class="check"><input type="checkbox" data-setting="${k}"${(cfg[k] ?? def) ? ' checked' : ''}> ${t('set_' + k)}</label>`).join('')}
    </section>
    <section>
      <h3>${t('phone')}</h3>
      ${remoteBlock()}
    </section>
    <section>
      <h3>${t('shots')}</h3>
      <div class="set-row"><span>${t('shotKey')}</span>
        <button class="keycap${S.capturing ? ' wait' : ''}" data-hotkey>${S.capturing ? t('pressKey') : esc(cfg.shotKey)}</button>
      </div>
      <div class="set-row"><span>${t('shotDir')}</span>
        <div class="dir-row"><code>${esc(cfg.shotRoot)}</code><button class="btn-glass" data-shot-dir>${t('change')}</button><button class="btn-glass" data-shot-open>${t('open')}</button></div>
      </div>
    </section>
    <section>
      <h3>${t('extra')} <span class="muted">${t('optional')}</span></h3>
      <p class="muted">${t('extraHint')}</p>
      <ul class="folders">${cfg.folders.map((f, i) => `<li><span>${esc(f)}</span><button data-folder-rm="${i}">${t('remove')}</button></li>`).join('')}</ul>
      <button class="btn-glass" data-folder-add>${t('addFolder')}</button>
    </section>
  </div>`;
}

// Phone remote: on/off, the QR code with the pairing link, and a reset for the pairing code
function remoteBlock() {
  const r = S.remote;
  if (r === undefined) { S.remote = null; gc.getRemote().then((x) => { S.remote = x; if (S.nav === 'settings') render(); }); }
  if (!r) return '';
  const toggle = `<label class="check"><input type="checkbox" id="remote-on"${r.on ? ' checked' : ''}> ${t('phoneOn')}</label>`;
  const err = r.error ? `<p class="remote-err">${t(r.error)}</p>` : '';
  if (!r.on) return `${toggle}${err}<p class="muted">${t('phoneOff')}</p>`;
  return `${toggle}${err}${r.qr ? `<div class="remote">
    <div class="qr">${r.qr}</div>
    <div class="remote-info">
      <p>${t('phoneHint')}</p>
      <p class="muted">${t('phoneAddr')}: <code>${esc(r.urls[0].split('#')[0])}</code></p>
      <p class="muted">${t('phoneFirewall')}</p>
      <p class="muted">${t('phoneChrome')}</p>
      <button class="btn-glass" data-remote-reset>${t('phoneReset')}</button>
    </div>
  </div>` : ''}`;
}

function renderPlatforms() {
  setAmbient(null);
  const a = S.accounts;
  if (!a) { view.innerHTML = ''; gc.getAccounts().then((x) => { S.accounts = x; render(); }); return; }
  const n = (src) => S.games.filter((g) => g.source === src).length;
  const pill = (on, label) => `<span class="pill${on ? ' on' : ''}">${label}</span>`;
  const body = {
    steam: () => `${pill(!!a.steam.name, a.steam.name ? `${t('connected')} · ${esc(a.steam.name)}` : t('notConnected'))}<p class="muted">${t('localRead')}</p>
      ${a.steam.api
        ? `${pill(!a.steam.api.error, a.steam.api.error ? t(a.steam.api.error) : t('steamApiOn'))}<p class="muted">${a.steam.api.synced ? t('lastSync', ago(a.steam.api.synced)) : ''}</p>
           <div class="p-actions"><button class="btn-glass" data-sync>${t('syncNow')}</button><button class="btn-glass danger" data-disconnect="steam">${t('disconnect')}</button></div>`
        : `<p class="muted">${t('steamApiHint')}</p>
           <div class="p-actions"><input id="steam-key" placeholder="${t('steamKey')}" spellcheck="false" autocomplete="off"><button class="btn-play" data-connect="steam">${t('connect')}</button></div>
           <button class="info-link" data-steam-info>ⓘ ${t('steamHowTo')}</button>`}`,
    xbox: () => (a.xbox
      ? `${pill(!a.xbox.error, a.xbox.error ? t(a.xbox.error) : `${t('connected')} · ${esc(a.xbox.name)}`)}
         <p class="muted">${a.xbox.synced ? t('lastSync', ago(a.xbox.synced)) : ''}</p>
         <div class="p-actions"><button class="btn-glass" data-sync>${t('syncNow')}</button><button class="btn-glass danger" data-disconnect="xbox">${t('disconnect')}</button></div>`
      : `${pill(false, t('notConnected'))}<p class="muted">${t('xboxHint')}</p>
         <div class="p-actions"><input id="xbox-client" placeholder="${t('clientId')}" value="${esc(a.xboxClientId)}" spellcheck="false"><button class="btn-play" data-connect="xbox">${t('connect')}</button></div>
         <button class="info-link" data-xbox-info>ⓘ ${t('howTo')}</button>`),
    epic: () => `${pill(false, t('notConnected'))}<p class="muted">${t('epicHint')}</p>`,
  };
  const other = () => `${pill(false, t('notConnected'))}<p class="muted">${t('localOnly')}</p>`;
  view.innerHTML = `<div class="settings platforms-page">
    <h2>${t('nav.platforms')}</h2>
    <p class="muted">${t('platformsHint')}</p>
    <div class="p-grid">${PLATFORMS.map((p) => `<section class="p-card">
      <div class="p-head"><h3>${SOURCE[p]}</h3><span class="muted">${t(n(p) === 1 ? 'game1' : 'games', n(p))}</span></div>
      ${(body[p] || other)()}
      <div class="p-foot">
        <label class="check"><input type="checkbox" data-platform="${p}"${S.cfg.off.includes(p) ? '' : ' checked'}> ${t('inLibrary')}</label>
        ${(a.launchers || []).includes(p) ? `<button class="btn-glass" data-platform-open="${p}">${t('openApp')}</button>` : ''}
      </div>
    </section>`).join('')}</div>
  </div>`;
}

function renderEmu() {
  setAmbient(null);
  const list = S.cfg.emulators || [];
  const games = S.games.filter((g) => g.source === 'emu' && !g.hidden && (!S.emuFilter || g.emuId === S.emuFilter))
    .sort((a, b) => a.name.localeCompare(b.name, locale()));
  const count = (id) => S.games.filter((g) => g.emuId === id).length;
  view.innerHTML = `<div class="home emu-page">
    <div class="section-head"><h2>${t('emus')}</h2><button class="btn-play" data-emu-add>${t('addEmu')}</button></div>
    ${list.length ? `<div class="emu-grid">${list.map((e) => `<div class="emu-card${S.emuFilter === e.id ? ' on' : ''}" data-emu-filter="${esc(e.id)}">
      <div><b>${esc(e.name)}</b><small>${esc(e.system || '—')} · ${t('roms', count(e.id))}</small></div>
      <div class="emu-btns"><button data-emu-open="${esc(e.id)}" title="${t('open')}">▶</button><button data-emu-edit="${esc(e.id)}">${t('edit')}</button><button data-emu-rm="${esc(e.id)}">${t('remove')}</button></div>
    </div>`).join('')}</div>` : `<div class="empty">${t('emuEmpty')}</div>`}
    ${games.length ? `<div class="section-head"><h3>${t('title.all')} <span>${games.length}</span></h3></div><div class="grid" style="--cols:${S.cols}">${games.map(card).join('')}</div>` : ''}
  </div>`;
}

function renderShots() {
  setAmbient(null);
  if (!S.shots) { view.innerHTML = ''; loadShots(); return; }
  if (S.shotFilter && !S.shots.some((g) => g.folder === S.shotFilter)) S.shotFilter = null; // that game's screenshots were deleted
  const total = S.shots.reduce((a, g) => a + g.files.length, 0);
  const groups = S.shots.filter((g) => !S.shotFilter || g.folder === S.shotFilter);
  const thumb = (f) => `<div class="shot-wrap">
    <button class="shot" data-shot="${esc(f.path)}"><img src="${esc(f.url)}" alt="" loading="lazy"></button>
    <div class="shot-acts"><button data-shot-copy="${esc(f.path)}" title="${t('copy')}">⧉</button><button data-shot-del="${esc(f.path)}" title="${t('delete')}">🗑</button></div>
  </div>`;
  view.innerHTML = `<div class="home shots-page">
    <div class="section-head"><h2>${t('shots')}</h2><button class="btn-glass" data-shot-open>${t('showInFolder')}</button></div>
    ${S.shots.length ? `<div class="chips-row shot-filter">
      <button class="chip pick${S.shotFilter ? '' : ' on'}" data-shot-filter="">${t('all')} <i>${total}</i></button>
      ${S.shots.map((g) => `<button class="chip pick${S.shotFilter === g.folder ? ' on' : ''}" data-shot-filter="${esc(g.folder)}">${esc(g.folder)} <i>${g.files.length}</i></button>`).join('')}
    </div>` : ''}
    ${S.shots.length ? groups.map((grp) => `<div class="shot-group">
      <div class="section-head"><h3>${esc(grp.folder)} <span>${grp.files.length}</span></h3></div>
      <div class="shot-grid">${grp.files.map(thumb).join('')}</div>
    </div>`).join('') : `<div class="empty">${t('shotsEmpty', esc(S.cfg.shotKey))}</div>`}
  </div>`;
}
const loadShots = safe(async () => { S.shots = await gc.listShots(); render(); });

// Yes/no box (for actions like delete)
function confirmBox(text, okLabel) {
  return new Promise((resolve) => {
    const d = document.createElement('div');
    d.className = 'modal';
    d.innerHTML = `<form><p>${esc(text)}</p><div><button type="button" class="btn-glass">${t('cancel')}</button><button class="btn-play">${esc(okLabel)}</button></div></form>`;
    const done = (v) => { d.remove(); resolve(v); };
    d.addEventListener('click', (e) => e.stopPropagation());
    d.querySelector('form').onsubmit = (e) => { e.preventDefault(); e.stopPropagation(); done(true); };
    d.querySelector('button[type=button]').onclick = () => done(false);
    document.body.append(d);
    d.querySelector('.btn-play').focus();
  });
}

const copyShot = safe(async (p) => { await gc.copyShot(p); toast(t('copied')); });
async function deleteShot(p) {
  if (!await confirmBox(t('confirmDelete'), t('delete'))) return false;
  try { await gc.deleteShot(p); } catch (e) { toast(t(String(e.message).replace(/^Error invoking remote method '[^']+': (Error: )?/, '')), true); return false; }
  toast(t('trashed'));
  S.shots = await gc.listShots();
  render();
  return true;
}

function render() {
  document.querySelectorAll('.sidebar [data-nav]').forEach((b) => b.classList.toggle('active', b.dataset.nav === (S.detail ? '' : S.nav)));
  $('#count').textContent = S.games.filter((g) => !g.hidden && g.source !== 'emu').length;
  const top = view.scrollTop;
  if (S.detail) renderDetail();
  else ({ settings: renderSettings, platforms: renderPlatforms, emu: renderEmu, shots: renderShots, stats: renderStats }[S.nav] || renderHome)();
  view.scrollTop = top;
}

// ---------- Xbox: how to get an Azure Client ID ----------
const AZURE_REDIRECT = 'https://login.microsoftonline.com/common/oauth2/nativeclient';
function xboxInfo() {
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="info-box">
    <h3>${t('howToTitle')}</h3>
    <ol>
      <li>${t('az0')} <a href="https://azure.microsoft.com/free/" target="_blank">azure.microsoft.com/free ↗</a></li>
      <li>${t('az1')} <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank">portal.azure.com ↗</a></li>
      <li>${t('az2')}</li>
      <li>${t('az3')}</li>
      <li>${t('az4')}<div class="copy-row"><code>${AZURE_REDIRECT}</code><button data-copy="${AZURE_REDIRECT}">${t('copy')}</button></div></li>
      <li>${t('az5')}</li>
    </ol>
    <p class="muted">${t('azNote')}</p>
    <div class="info-actions"><button class="btn-glass" data-close>${t('close')}</button></div>
  </div>`;
  const close = () => { d.remove(); document.removeEventListener('keydown', esc_, true); };
  const esc_ = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  d.addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // the link opens in the browser
    e.stopPropagation();
    if (e.target === d || e.target.closest('[data-close]')) return close();
    const c = e.target.closest('[data-copy]');
    if (c) safe(gc.copyText)(c.dataset.copy).then(() => toast(t('copied')));
  });
  document.addEventListener('keydown', esc_, true);
  document.body.append(d);
}

// How to get a Steam Web API key (same dialog as the Xbox one)
function steamInfo() {
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="info-box">
    <h3>${t('steamHowToTitle')}</h3>
    <ol>
      <li>${t('sk1')} <a href="https://steamcommunity.com/dev/apikey" target="_blank">steamcommunity.com/dev/apikey ↗</a></li>
      <li>${t('sk2')}</li>
      <li>${t('sk3')}</li>
      <li>${t('sk4')} <a href="https://steamcommunity.com/my/edit/settings" target="_blank">steamcommunity.com/my/edit/settings ↗</a></li>
    </ol>
    <p class="muted">${t('skNote')}</p>
    <div class="info-actions"><button class="btn-glass" data-close>${t('close')}</button></div>
  </div>`;
  const close = () => { d.remove(); document.removeEventListener('keydown', esc_, true); };
  const esc_ = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  d.addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // the link opens in the browser
    e.stopPropagation();
    if (e.target === d || e.target.closest('[data-close]')) return close();
    const c = e.target.closest('[data-copy]');
    if (c) safe(gc.copyText)(c.dataset.copy).then(() => toast(t('copied')));
  });
  document.addEventListener('keydown', esc_, true);
  document.body.append(d);
}

// ---------- image viewer ----------
// Navigation is limited to the clicked image's list: all images without a filter, otherwise that game's
function lightbox(file) {
  const folder = S.nav === 'shots' && !S.shotFilter && !S.detail ? null : (S.shots || []).find((g) => g.files.some((f) => f.path === file))?.folder;
  const scope = () => (S.shots || []).filter((g) => !folder || g.folder === folder).flatMap((g) => g.files);
  let all = scope();
  let i = Math.max(0, all.findIndex((f) => f.path === file));
  if (!all.length) return;
  const d = document.createElement('div');
  d.className = 'lightbox';
  const show = () => {
    d.innerHTML = `<img src="${esc(all[i].url)}" alt="">
      <div class="lb-bar"><span>${i + 1} / ${all.length}</span>
        <button class="btn-glass" data-lb="copy">⧉ ${t('copy')}</button>
        <button class="btn-glass danger" data-lb="del">🗑 ${t('delete')}</button>
        <button class="btn-glass" data-lb="reveal">${t('showInFolder')}</button>
        <button class="btn-glass" data-lb="close">${t('close')}</button></div>
      ${all.length > 1 ? `<button class="hero-nav prev" data-lb="-1">${ARROW(-1)}</button><button class="hero-nav next" data-lb="1">${ARROW(1)}</button>` : ''}`;
  };
  const close = () => { d.remove(); document.removeEventListener('keydown', key, true); };
  const key = (e) => {
    if (document.querySelector('.modal')) return; // while the delete confirmation is open
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'ArrowLeft') { i = (i - 1 + all.length) % all.length; show(); }
    if (e.key === 'ArrowRight') { i = (i + 1) % all.length; show(); }
    if (e.key === 'Delete') d.querySelector('[data-lb=del]').click();
    if (e.ctrlKey && e.key.toLowerCase() === 'c') copyShot(all[i].path);
  };
  d.addEventListener('click', async (e) => {
    e.stopPropagation();
    const b = e.target.closest('[data-lb]');
    if (!b) { if (e.target === d) close(); return; }
    const v = b.dataset.lb;
    if (v === 'close') close();
    else if (v === 'reveal') safe(gc.revealShot)(all[i].path);
    else if (v === 'copy') copyShot(all[i].path);
    else if (v === 'del') {
      if (!await deleteShot(all[i].path)) return;
      all = scope(); // list re-read, the deleted one is gone
      if (!all.length) return close();
      i = Math.min(i, all.length - 1);
      show();
    } else { i = (i + +v + all.length) % all.length; show(); }
  });
  document.addEventListener('keydown', key, true);
  show();
  document.body.append(d);
}

// ---------- emulator form ----------
function emuForm(emu = {}) {
  const e = { args: '"{rom}"', exts: [], system: '', ...emu };
  const d = document.createElement('div');
  d.className = 'modal';
  const draw = () => {
    d.innerHTML = `<form class="emu-form">
      <h3>${emu.id ? t('editEmu') : t('addEmu').replace('+ ', '')}</h3>
      <label>${t('emuExe')}<span class="launch-box"><code title="${esc(e.exe || '')}">${esc(e.exe || '—')}</code><button type="button" data-f="exe">${t('choose')}</button></span></label>
      <label>${t('displayName')}<input name="name" value="${esc(e.name || '')}"></label>
      <label>${t('romDir')}<span class="launch-box"><code title="${esc(e.romDir || '')}">${esc(e.romDir || '—')}</code><button type="button" data-f="rom">${t('pickFolder')}</button></span></label>
      <label>${t('system')}<select name="system"><option value="">${t('none')}</option>${S.cfg.systems.map((x) => `<option${x === e.system ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label>${t('args')}<input name="args" value="${esc(e.args)}" spellcheck="false"><small class="muted">${esc(t('argsHint'))}</small></label>
      <label>${t('exts')}<input name="exts" value="${esc(e.exts.join(', '))}" spellcheck="false"></label>
      <div><button type="button" class="btn-glass" data-f="cancel">${t('cancel')}</button><button class="btn-play">${t('save')}</button></div>
    </form>`;
  };
  const sync = () => {
    const f = new FormData(d.querySelector('form'));
    Object.assign(e, { name: f.get('name'), system: f.get('system'), args: f.get('args'), exts: f.get('exts').split(',').map((x) => x.trim()).filter(Boolean) });
  };
  d.addEventListener('click', async (ev) => {
    ev.stopPropagation(); // keep the page's global click handler away from the form
    const b = ev.target.closest('[data-f]');
    if (!b) return;
    if (b.dataset.f === 'cancel') return d.remove();
    sync();
    if (b.dataset.f === 'exe') {
      const p = await gc.pickEmuExe();
      if (p) Object.assign(e, emu.id ? { exe: p.exe } : p); // fill in presets for a new emulator
    }
    if (b.dataset.f === 'rom') { const dir = await gc.pickFolder(); if (dir) e.romDir = dir; }
    draw();
  });
  d.addEventListener('submit', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    sync();
    safe(async () => {
      S.games = await gc.saveEmu(e);
      S.cfg = await gc.getConfig();
      d.remove();
      toast(t('saved'));
      render();
    })();
  });
  draw();
  document.body.append(d);
}

// ---------- events ----------
const upsert = (g) => { if (!g) return; const i = S.games.findIndex((x) => x.key === g.key); if (i >= 0) S.games[i] = g; else S.games.push(g); };
const refresh = (g) => { upsert(g); render(); };
let scrollMemo = 0;
const act = {
  open: (key, el) => {
    scrollMemo = view.scrollTop;
    S.opened = key;
    document.querySelectorAll('.card').forEach((c) => c.style.removeProperty('view-transition-name')); // the name must be unique
    el?.style.setProperty('view-transition-name', 'banner'); // card -> banner grow transition
    go(() => { S.detail = key; S.editing = false; S.steamResults = null; S.steamQ = null; render(); view.scrollTop = 0; });
  },
  back: () => go(() => { S.detail = null; S.editing = false; render(); view.scrollTop = scrollMemo; }),
  play: safe(async (key) => {
    const g = S.games.find((x) => x.key === key);
    toast(t('starting', g.name));
    refresh(await gc.launch(key));
  }),
  fav: safe(async (key) => {
    const g = S.games.find((x) => x.key === key);
    refresh(await gc.update(key, { favorite: !g.favorite }));
  }),
  feature: (i) => { S.featured = i; restartRotation(); go(render, 'hero'); },
};

const saveConfig = safe(async (patch) => {
  const langChanged = patch.lang && patch.lang !== lang;
  S.cfg = { ...S.cfg, ...patch };
  lang = S.cfg.lang;
  applyTheme();
  applyStatic();
  if (langChanged) S.genre = ''; // genres will arrive in the new language
  S.games = await gc.setConfig(S.cfg);
  render();
});

// Hotkey capture: e.code is used so it's keyboard-layout independent
function accelerator(e) {
  const c = e.code;
  const key = (c.match(/^Key([A-Z])$/) || c.match(/^Digit(\d)$/) || c.match(/^(F\d{1,2})$/) || [])[1]
    || { Space: 'Space', PrintScreen: 'PrintScreen', Insert: 'Insert', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown', Pause: 'Pause', ScrollLock: 'Scrolllock', Backquote: '`' }[c];
  if (!key) return null;
  return [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', key].filter(Boolean).join('+');
}
document.addEventListener('keydown', (e) => {
  if (!S.capturing) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape') { S.capturing = false; return render(); }
  const acc = accelerator(e);
  if (!acc) return; // only Ctrl/Shift/Alt pressed, wait for the real key
  S.capturing = false;
  saveConfig({ shotKey: acc });
}, true);

document.addEventListener('click', async (e) => {
  const el = e.target.closest('button, [data-open], [data-emu-filter]');
  if (!el) return;
  const d = el.dataset;
  if (d.play) { e.stopPropagation(); return act.play(d.play); }
  if (d.fav) { e.stopPropagation(); return act.fav(d.fav); }
  if (d.shot) return lightbox(d.shot);
  if ('random' in d) return randomPick();
  if (d.cols) { S.cols = +d.cols; try { localStorage.setItem('gridCols', d.cols); } catch { /* not remembering the preference is fine */ } return go(render, 'hero'); }
  if (d.colRm) { const g = S.games.find((x) => x.key === S.detail); return setCollections(g.key, g.collections.filter((c) => c !== d.colRm)); }
  if (d.shotCopy) return copyShot(d.shotCopy);
  if (d.shotDel) return deleteShot(d.shotDel);
  if (d.shotFilter !== undefined) return go(() => { S.shotFilter = d.shotFilter || null; render(); });
  if (d.shotGoto) return go(() => { S.nav = 'shots'; S.detail = null; S.shotFilter = d.shotGoto; render(); view.scrollTop = 0; });
  if ('remoteReset' in d) { S.remote = await safe(gc.resetRemote)() || S.remote; toast(t('phoneResetDone')); return render(); }
  if ('steamInfo' in d) return steamInfo();
  if ('xboxInfo' in d) return xboxInfo();  if ('shotOpen' in d) return safe(gc.revealShot)(null);
  if ('shotDir' in d) { S.cfg = await gc.pickShotDir(); S.shots = null; loadShots(); return; }
  if ('hotkey' in d) { S.capturing = true; return render(); }
  if (d.connect) {
    const n = await safe(gc.connect)(d.connect, { clientId: $('#xbox-client')?.value, key: $('#steam-key')?.value });
    if (n) { S.accounts = n; toast(t('connected')); S.games = await gc.getLibrary(); render(); }
    return;
  }
  if (d.disconnect) { S.accounts = await safe(gc.disconnect)(d.disconnect) || S.accounts; return render(); }
  if ('sync' in d) { toast(t('downloading')); S.accounts = await safe(gc.syncAccounts)() || S.accounts; return render(); }
  if ('emuAdd' in d) return emuForm();
  if (d.emuEdit) { e.stopPropagation(); return emuForm(S.cfg.emulators.find((x) => x.id === d.emuEdit)); }
  if (d.emuOpen) { e.stopPropagation(); return safe(gc.openEmu)(d.emuOpen); }
  if (d.emuRm) {
    e.stopPropagation();
    S.games = await safe(gc.removeEmu)(d.emuRm) || S.games;
    S.cfg = await gc.getConfig();
    S.emuFilter = null;
    return render();
  }
  if (d.emuFilter) return go(() => { S.emuFilter = S.emuFilter === d.emuFilter ? null : d.emuFilter; render(); });
  if (d.step) return act.feature(S.featured + +d.step);
  if (d.open) return act.open(d.open, el.classList.contains('card') ? el : null);
  if ('back' in d) return act.back();
  if (d.lang) return go(() => saveConfig({ lang: d.lang }));
  if (d.accent) return saveConfig({ accent: d.accent });
  if (d.nav) {
    if (d.nav === 'platforms') S.accounts = null; // fresh account status every time the page opens
    return go(() => { S.nav = d.nav; S.detail = null; S.genre = ''; S.publisher = ''; S.status = ''; S.collection = ''; render(); view.scrollTop = 0; });
  }
  if (d.feature) return act.feature(+d.feature);
  if (d.genre !== undefined) return go(() => { S.genre = d.genre; render(); });
  if (d.folder) return safe(gc.openFolder)(d.folder);
  if (d.steamShow) return safe(gc.showInSteam)(d.steamShow);
  if (d.platformOpen) return safe(gc.openPlatform)(d.platformOpen);
  if ('edit' in d) { S.editing = !S.editing; render(); if (S.editing) $('#edit').scrollIntoView({ behavior: 'smooth' }); return; }
  const key = S.detail;
  if ('launchPick' in d) return refresh(await safe(gc.setLaunch)(key, false));
  if ('launchReset' in d) return refresh(await safe(gc.setLaunch)(key, true));
  if ('steamSearch' in d) return steamSearch();
  if (d.steamPick || 'steamReset' in d) {
    toast(t('downloading'));
    const g = await safe(gc.setSteamId)(key, d.steamPick || null);
    if (g) { S.steamResults = null; S.steamQ = null; refresh(g); toast(t('updated')); }
    return;
  }
  if (d.img) return refresh(await safe(gc.setImage)(key, d.img));
  if (d.imgUrl) {
    const url = await ask(t('imgUrl'));
    if (url) refresh(await safe(gc.setImage)(key, d.imgUrl, url));
    return;
  }
  if (d.imgReset) return refresh(await safe(gc.setImage)(key, d.imgReset, null));
  if ('refetch' in d) { toast(t('downloading')); const g = await safe(gc.refetch)(key); if (g) { refresh(g); toast(t('updated')); } return; }
  if (d.uninstall) {
    const g = S.games.find((x) => x.key === d.uninstall);
    if (!await confirmBox(t('confirmUninstall', g.name, srcName(g)), t('uninstall'))) return;
    const how = await safe(gc.uninstall)(g.key);
    if (how) toast(t(`un_${how}`), false, how === 'epic' ? 9000 : 4500);
    return;
  }
  if ('hide' in d) {
    const g = S.games.find((x) => x.key === key);
    const n = await safe(gc.update)(key, { hidden: !g.hidden });
    if (n) { refresh(n); toast(n.hidden ? t('hidden') : t('shown')); }
    return;
  }
  if ('folderAdd' in d) { const f = await gc.pickFolder(); if (f) saveConfig({ folders: [...S.cfg.folders, f] }); return; }
  if (d.folderRm) return saveConfig({ folders: S.cfg.folders.filter((_, i) => i !== +d.folderRm) });
});

const steamSearch = safe(async () => {
  S.steamQ = $('#steam-q').value;
  S.steamResults = await gc.searchSteam(S.steamQ);
  render();
  $('#steam-q')?.focus();
});

document.addEventListener('keydown', (e) => {
  // Enter in the search box searches instead of saving the form
  if (e.key === 'Enter' && e.target.id === 'steam-q') { e.preventDefault(); return steamSearch(); }
  if (e.key === 'Enter' && e.target.id === 'col-new') {
    e.preventDefault();
    const v = e.target.value.trim();
    const g = S.games.find((x) => x.key === S.detail);
    if (v && g) setCollections(g.key, [...g.collections, v]);
    return;
  }
  if (e.key === 'Enter' && e.target.dataset?.open) act.open(e.target.dataset.open, e.target);
  if (e.key === 'Escape' && S.detail && !e.target.closest('input, textarea')) act.back();
  if (e.ctrlKey && e.key.toLowerCase() === 'f') { e.preventDefault(); $('#search').focus(); $('#search').select(); }
});

// live preview while dragging the color picker, save on release
document.addEventListener('input', (e) => {
  if (e.target.id === 'accent-custom') document.documentElement.style.setProperty('--accent', e.target.value);
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'f-pub') go(() => { S.publisher = e.target.value; render(); });
  if (e.target.id === 'f-sort') go(() => { S.sort = e.target.value; render(); });
  if (e.target.id === 'f-status') go(() => { S.status = e.target.value; render(); });
  if (e.target.id === 'f-col') go(() => { S.collection = e.target.value; render(); });
  if (e.target.id === 'd-status') safe(async () => refresh(await gc.update(S.detail, { status: e.target.value })))();
  if (e.target.id === 'accent-custom') saveConfig({ accent: e.target.value });
  if (e.target.dataset.setting) saveConfig({ [e.target.dataset.setting]: e.target.checked });
  if (e.target.id === 'remote-on') safe(async () => { S.remote = await gc.setRemote(e.target.checked); render(); })();
  if (e.target.dataset.platform) {
    const off = [...document.querySelectorAll('[data-platform]')].filter((x) => !x.checked).map((x) => x.dataset.platform);
    saveConfig({ off });
  }
});

document.addEventListener('submit', safe(async (e) => {
  if (e.target.id !== 'edit') return;
  e.preventDefault();
  const g = await gc.update(S.detail, { name: new FormData(e.target).get('name') });
  S.editing = false;
  refresh(g);
  toast(t('saved'));
}));

let searchT;
$('#search').addEventListener('input', (e) => {
  clearTimeout(searchT);
  searchT = setTimeout(() => { S.q = e.target.value; S.detail = null; if (!['all', 'fav', 'recent', 'hidden'].includes(S.nav)) S.nav = 'all'; render(); }, 120);
});

$('#rescan').addEventListener('click', safe(async () => {
  S.games = await gc.scan();
  render();
  toast(t('found', S.games.length));
}));

// Electron has no prompt(); a small input box
function ask(label) {
  return new Promise((resolve) => {
    const d = document.createElement('div');
    d.className = 'modal';
    d.innerHTML = `<form><label>${esc(label)}<input></label><div><button type="button" class="btn-glass">${t('cancel')}</button><button class="btn-play">${t('ok')}</button></div></form>`;
    document.body.append(d);
    const done = (v) => { d.remove(); resolve(v); };
    d.querySelector('form').onsubmit = (e) => { e.preventDefault(); e.stopPropagation(); done(d.querySelector('input').value.trim()); };
    d.querySelector('button[type=button]').onclick = () => done(null);
    d.querySelector('input').focus();
  });
}

// refresh the screen as info arrives / games get installed (don't disturb the form while typing)
let renderT;
const quietRender = () => { clearTimeout(renderT); renderT = setTimeout(() => { if (!S.editing) render(); }, 250); };
gc.onUpdated((g) => { upsert(g); quietRender(); });
// Short, soft shutter sound (~0.12 s): two light clicks, generated with Web Audio, no sound file needed
let audioCtx;
function shutterSound() {
  try {
    audioCtx ||= new AudioContext();
    const ctx = audioCtx;
    ctx.resume();
    const len = Math.floor(ctx.sampleRate * 0.045);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; // quickly fading noise
    [[0, 3200, 0.16], [0.07, 2300, 0.1]].forEach(([at, freq, vol]) => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq;
      f.Q.value = 1.1;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(ctx.currentTime + at);
    });
  } catch { /* if sound can't play, stay silent */ }
}
gc.onShot(() => { shutterSound(); loadShots(); });
// ---------- updates ----------
// A new version on GitHub shows a small badge next to the language switch; clicking it opens the release notes
// and an "Update now" button that downloads the installer and restarts Ludora on the new version.
let pendingUpdate = null;
function showUpdate(u) {
  pendingUpdate = u;
  const pill = $('#update-pill');
  pill.hidden = !u;
  if (u) { pill.textContent = `⬆ ${t('updateBadge', u.version)}`; pill.title = t('updateTitle', u.version); }
}
// release notes are Markdown; show them as plain text
const plainNotes = (md) => md.replace(/^#+\s*/gm, '').replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').trim();
function updateModal() {
  const u = pendingUpdate;
  if (!u) return;
  const d = document.createElement('div');
  d.className = 'modal';
  d.innerHTML = `<div class="info-box update-box">
    <h3>${esc(t('updateTitle', u.version))}</h3>
    <p class="muted">${esc(t('updateCurrent', S.appVersion || ''))}</p>
    <div class="notes">${esc(plainNotes(u.notes)).replace(/\n/g, '<br>')}</div>
    <div class="progress" hidden><span></span></div>
    <p class="muted small">${esc(t('updateHint'))}</p>
    <div class="info-actions"><button class="btn-glass" data-u="later">${t('later')}</button><button class="btn-play" data-u="install">${t('updateNow')}</button></div>
  </div>`;
  const close = () => { if (!d.dataset.busy) d.remove(); };
  d.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (e.target === d) return close();
    const b = e.target.closest('[data-u]');
    if (!b) return;
    if (b.dataset.u === 'later') return close();
    d.dataset.busy = '1';
    b.disabled = true;
    b.textContent = t('downloading');
    d.querySelector('.progress').hidden = false;
    try {
      await gc.installUpdate();
      b.textContent = t('installing');
    } catch (err) {
      delete d.dataset.busy;
      b.disabled = false;
      b.textContent = t('updateNow');
      toast(t(String(err.message).replace(/^Error invoking remote method '[^']+': (Error: )?/, '')), true);
    }
  });
  document.body.append(d);
}
gc.onUpdate(showUpdate);
gc.onUpdateProgress((p) => {
  const bar = document.querySelector('.update-box .progress span');
  if (bar) bar.style.width = `${Math.round(p * 100)}%`;
});
$('#update-pill').addEventListener('click', updateModal);

gc.onChanged((list) => {
  const added = list.filter((g) => g.source !== 'emu' && !S.games.some((x) => x.key === g.key));
  S.games = list;
  if (added.length && S.games.length !== added.length) toast(t('newGame', added.map((g) => g.name).join(', ')));
  quietRender();
});

let rotT;
function restartRotation() {
  clearInterval(rotT);
  rotT = setInterval(() => {
    if (S.detail || S.nav !== 'all' || S.q || $('.hero-row:hover') || document.hidden || overlayOpen()) return;
    S.featured++;
    go(render, 'hero');
  }, 9000);
}

safe(async () => {
  S.cfg = await gc.getConfig();
  lang = S.cfg.lang || 'tr';
  applyTheme();
  applyStatic();
  S.games = await gc.getLibrary();
  render();
  restartRotation();
  loadShots(); // for the screenshot strip on game pages
  S.appVersion = S.cfg.appVersion;
  showUpdate(await gc.getUpdate());
})();
