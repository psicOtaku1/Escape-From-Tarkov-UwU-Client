var lang = 'en',
	langs = {
		ru: 'Русский',
		en: 'English',
		de: 'Deutsch',
		it: 'Italiano',
		es: 'Español',
		mx: 'Español mexicano',
		fr: 'Français',
		pt: 'Português',
		tr: 'Türkçe',
		zh: '中文'
	},
	browserVisible = false,
	environment = null,
	settings = null,
	supportConfiguration = {
		categories: [],
		gameLogsFreshnessSec: 0,
		gameLogsSizeLimit: 0
	},
	selectedBranch = null,
	siteConfig = null,
	condition = {
		gameUpdateState: "Idle",
		gameState: "Idle"
	},
	pauseStateBuffer = null,
	windowIsDragging = false,
	selectFolderGameUpdateStates = ["Idle", "UpdateError"],
	selectFolderGameStates = ["InstallRequired", "UpdateRequired", "RepairRequired", "ReinstallRequired", "ReadyToGame"],
	checkForUpdateGameUpdateStates = ["Idle", "UpdateError"],
	checkForUpdateGameStates = ["UpdateRequired", "ReadyToGame"],
	selectBranchGameUpdateStates = ["Idle", "Pause", "Stopped", "UpdateError"],
	selectBranchGameStates = ["InstallRequired", "UpdateRequired", "RepairRequired", "ReinstallRequired", "ReadyToGame"],
	sendFeedbackGameUpdateStates = ["Idle", "Pause", "Stopped", "UpdateError"],
	sendFeedbackGameStates = ["UpdateRequired", "RepairRequired", "ReinstallRequired", "ReadyToGame"],
	launcher_version="",
	game_edition="",
	game_version="",
	game_region="",
	ets_tester_status=null,
	bugReportDisabledMessage = null,
	volume = 50,
	sm2distr = {
		"debug": "/js/plugins/sm2/soundmanager2.js",
		"default": "/js/plugins/sm2/soundmanager2-nodebug-jsmin.js"
	},
	soundFolder = 'MOD',
	sounds = null,
	feedbackTextInputMinLen=0,
	feedbackTextInputMaxLen=255,
	feedbackTextAreaMinLen=0,
	feedbackTextAreaMaxLen=500,
	geoInfo = {
		"country": null,
		"continent": null,
	},
	editions = {
		"not_purchased"     : '<span class="error" data-i18n="Game not purchased!"></span>',
		"standard"          : "UwU - Standard Edition",
		"left_behind"       : "UwU - Left Behind Edition",
		"prepare_for_escape": "UwU - Prepare for Escape Edition",
		"edge_of_darkness"  : "UwU - Edge of Darkness Limited Edition",
		"press_edition"     : "UwU - Press Edition",
		"tournament"     	: "UwU - Tournament Edition",
		"tournament_live"   : "UwU - Tournament Edition Live",
	},
	current_page = 'main',
	pageParams = {
		branch: {
			default: {
				main: {
					id: "main_content",
					imgPos: "center top",
					img: "/MOD/custom_bg/main_art.jpg"
				},
				news: {
					id: "news_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/news_art.jpg"
				},
				news_item: {
					id: "news_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/news_item_art.jpg"
				},
				settings: {
					id: "settings_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/settings_art.jpg"
				},
				ets: {
					id: "ets_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/settings_art_ets.jpg"
				}
			},
			ets: {
				main: {
					id: "main_content",
					imgPos: "center top",
					img: "/MOD/custom_bg/main_art_ets.jpg"
				},
				news: {
					id: "news_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/news_art_ets.jpg"
				},
				news_item: {
					id: "news_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/news_art_ets.jpg"
				},
				settings: {
					id: "settings_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/settings_art_ets.jpg"
				},
				ets: {
					id: "ets_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/settings_art_ets.jpg"
				}
			},
			tournament: {
				main: {
					id: "main_content",
					imgPos: "center top",
					img: "/MOD/custom_bg/main_art_tournament.jpg"
				},
				news: {
					id: "news_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/news_art_tournament.jpg"
				},
				news_item: {
					id: "news_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/news_art_tournament.jpg"
				},
				settings: {
					id: "settings_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/settings_art_tournament.jpg"
				},
				ets: {
					id: "ets_content",
					imgPos: "right top",
					img: "/MOD/custom_bg/settings_art_tournament.jpg"
				}
			}
		}
	},
	game_dir_pregmatch = /^[\\\?]*/g,
	w_maximize = $("#window_buttons>.maximize"),
	w_minimize = $("#window_buttons>.minimize"),
	w_close = $("#window_buttons>.close"),
	main_menu = $('#head>.wrap .menu>ul'),
	main_menu_collapse_width = null,
	main_menu_game_item = main_menu.find('.game'),
	vkApiTransportLoading = false,
	twApiTransportLoading = false,
	vkTimerRepeaterId = null,
	contentCache = {},
	contentCacheInterval = 86400000, //in milliseconds 1 day
	main_carousel = null,
	news_carousel = null,
	news_list = null,
	news_total = null,
	append_page = 1,
	appending = false,
	important_news = $("#important_news>.wrap"),
	important_news_marquee_speed = 40,
	s2opt = {
		minimumResultsForSearch: -1,
		placeholder: '',
		language: "en"
	},
	main_slick_config = {
		dots: false,
		infinite: true,
		speed: 500,
		autoplay: false,
		autoplaySpeed: 10000,
		fade: true,
		cssEase: 'linear',
		prevArrow: '<div class="slick-prev"></div>',
		nextArrow: '<div class="slick-next"></div>'
	},
	news_slick_config = {
		dots: true,
		infinite: true,
		speed: 500,
		autoplay: false,
		autoplaySpeed: 10000,
		fade: true,
		cssEase: 'linear',
		prevArrow: '<div class="slick-prev"></div>',
		nextArrow: '<div class="slick-next"></div>',
		appendDots: '#news_list .slick-slide .caption'
	},
	YT_ready = false,
	video_players = [],
	game_main = $('#game_main'),
	head_user_block = $('#head .wrap .user'),
	mobile_menu = $('#mobile_menu'),
	user_menu = $('#user_menu'),
	game_installer = $('#game_installing'),
	game_install_button = $("#game_main [data-main-button]"),
	top_button_select_folder = game_main.find('.top_buttons .select-folder'),
	top_button_check_updates = game_main.find('.top_buttons .check-updates'),
	game_time_left = $('#game_time_left'),
	game_size_left = $('#game_size_left'),
	game_size_total = $('#game_size_total'),
	game_current_speed = $('#game_current_speed'),
	progress_bar = $('#game_installing .progress .slider'),
	launcher_progress_bar = $('#progress_bar_page .progress .slider'),
	site_url = 'https://github.com/psicOtaku1/Escape-From-Tarkov-UwU-Client',
	api_route= 'launcher/',
	authCenterUri = 'https://www.escapefromtarkov.com',
	authCenterLinks = {
		root: '/',
		profile: '/profile',
		preorder: '/preorder-page',
		activatePromo: '/promo/activate',
		resetPassword: '/reset-password',
		resetProfile: '/reset-game-profile',
		registration: '/registration'
	},
	main_menu_links = {
		root: '',
		support: '/support'
	},
	resize_timeout = false,
	resize_time,
	resize_delta = 200,
	autoUpdateInterval = 30*60*1000,
	dummy_image = '/MOD/custom_dummy/dummy.gif',
	dummy_avatar = '/MOD/custom_dummy/avatar.gif',
	dummy_news_item = '/MOD/custom_dummy/dummyNewsItem.gif',
	serializeConf = {
		checkboxUncheckedValue: 'false',
		parseBooleans: true,
		parseAll: true
	},
	pushstreams = [],
	pushstreamBuffer = [],
	pushstreamConfig = {
		urlPrefixWebsocket: '/push/notifier/getwebsocket',
		host: "wstream.escapefromtarkov.com",
		port: window.location.port,
		modes: "websocket",
		// channelsByArgument: true,
		// channelsArgument: 'id', //this is the default value, you have to change it to be the same value used on push_stream_channels_path directive
		messagesPublishedAfter: 5, //Getting old messages
		messagesControlByArgument: true //Getting old messages
	},
	pushstreamWaitUntilRefresh = [0, 5*60*1000],
	errorMessageLangPrefix = 'error_msg_',
	loginCountdown,
	playButtonForceLocked = false,
	//http://ionden.com/a/plugins/ion.rangeSlider/api.html,
	//simply can be customized with data-{key} html5 attributes
	ionSliderDefaultConfig = {
		type: "single",
		skin: "eft",
		hide_min_max: true,
		hide_from_to: true,
		onStart: function (data) {
			var id = data.input.attr('id'),
				label = $('label[for="'+id+'"]');
			if(label.length) {
				label.find('[data-value]').text(data.from_pretty+"%");
			}
			if(typeof setVolume === 'function') {
				setVolume(data.from);
			}
		},
		onChange: function (data) {
			var id = data.input.attr('id'),
				label = $('label[for="'+id+'"]');
			if(label.length) {
				label.find('[data-value]').text(data.from_pretty+"%");
			}
			if(typeof setVolume === 'function') {
				setVolume(data.from);
			}
		},
		onFinish: function (data) {
			if(typeof playSound === 'function') {
				playSound("volume_check.wav");
			}
		},
	}
;