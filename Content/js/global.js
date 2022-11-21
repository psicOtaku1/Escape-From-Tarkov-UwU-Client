//Bind launcher async object into DOM
(async function()
{
	await CefSharp.BindObjectAsync("launcher");
})();
(async function()
{
	$(document).ready( function () {
		setTimeout(function () {
			launcherDisplayBrowser();
		}, 2000);
	});
})();
try {
	$.ajaxSetup({async:true, cache:true});
} catch (e) {
	console.log(e);
}

$(document).ready( function () {
	whenAvailable('launcher', function () {
		launcher.getSettings().then(function( data ) {
			data = $.parseJSON(data);
			settings = data;
			lang = data.language;
			onSettingsUpdated(settings);
			initLocalization(data.language);
			if(typeof getSupportConfiguration === 'function') {
				getSupportConfiguration();
			}
			if(typeof refreshNetworkState === "function") {
				refreshNetworkState();
			}
			if($('#head .wrap .user').length) {
				drawUserData();
				renderBackground('main');
			}
			if($('#queueNotifyWithSound').length && typeof data.queueNotifyWithSound !== "undefined") {
				if (true == data.queueNotifyWithSound) {
					$('#queueNotifyWithSound').attr('checked', 'checked');
				} else {
					$('#queueNotifyWithSound').removeAttr('checked');
				}
			}
			if($('#queueAutoLogIn').length && typeof data.queueAutoLogIn !== "undefined") {
				if (true == data.queueAutoLogIn) {
					$('#queueAutoLogIn').attr('checked', 'checked');
				} else {
					$('#queueAutoLogIn').removeAttr('checked');
				}
			}
			if($('#LauncherLogin').length) {
				initLoginPage(data.saveLogin, data.savePassword, data.login);
			}
			if($('#license_agreement_page').length) {
				if(typeof getLegalRequiredDoc === 'function') {
					getLegalRequiredDoc(data.aid, data.language);
				}
				if($('#language').length) {
					$('#language').val(data.language);
				}
			}
			if(typeof initSound === "function") {
				initSound();
			}
			whenAvailable('yaCounter46073604',  function() {
				yaCounter46073604.setUserID(toString(data.aid));
			});
		});
		
		initResizeListeners();
		initWindowManipulations();
	});
	$(document).on('click', '.reach-goal', function(e) {
		//action, label, page
		var action = $(this).attr('data-action') || 'click',
			label = $(this).attr('data-label') || false,
			page = $(this).attr('data-page') || 'index';
		ReachGoal(action, label, page);
	});
	$(document).on('click', '[data-open-directory]', function(e) {
		navigateToDirectory($(this).text());
	});
});

function initWindowManipulations() {
	w_close.click(function(e){
		launcherClose();
	});
	
	w_maximize.click(function(e){
		if(w_maximize.hasClass('maximized')) {
			launcherRestore();
		} else {
			launcherMaximize();
		}
	});
	
	w_minimize.click(function(e){
		launcherMinimize();
	});

}

function setUserETSStatus(val) {
	console.log('status ' + val)
	if(window.ets_tester_status !== val && window.ets_tester_status !== null) {
		if(typeof reloadSettings === 'function') {
			reloadSettings();
		}
		if(typeof showUserEtsStatus === 'function') {
			showUserEtsStatus(val);
		}
	}
	window.ets_tester_status = val;
	if(typeof refreshBranchSelectorState === 'function') {
		refreshBranchSelectorState();
	}
}


function setLauncherVersion(version) {
	window.launcher_version = version;
	if($('#LauncherVersion').length){
		$('#LauncherVersion').text(version);
	}
}
function setGameInfo(edition, version, region) {
	setGameEdition(edition);
	setGameVersion(version);
	setGameRegion(region);
}
function setGameEdition(edition) {
	if(edition.length === 0 || !edition || typeof edition === 'undefined') {
		edition = "not_purchased";
	}

	window.game_edition = edition;
	
	if(game_main.length) {
		game_main.find('[data-type="edition"]').html(window.editions[edition]);
		try {
			whenJqueryFuncAvailable('localize',  function() {
				game_main.localize();
			});
		} catch(e) {
			console.log(e);
		}
	}
	
	if($('div[onclick="showBugreport(this)"]').length) {
		if("not_purchased" === edition) {
			$('div[onclick="showBugreport(this)"]').addClass('disabled');
		} else {
			$('div[onclick="showBugreport(this)"]').removeClass('disabled');
		}
	}
}
function setGameVersion(version) {
	window.game_version = version;
	if(!version || version==="" || version==="null") {
		version = '<span data-i18n="Not installed"></span>';
	}
	$('[data-type="version"]').html(version);
}
function setGameRegion(region) {
	window.game_region = region;
	if(game_main.length) {
		if(!region.length || region==="") {
			region = '<span data-i18n="empty"></span>';
		}
		game_main.find('[data-type="region"]').html(region);
		try {
			whenJqueryFuncAvailable('localize',  function() {
				game_main.localize();
			});
		} catch(e) {
			console.log(e);
		}
	}
}

function renderSeconds(seconds) {
	var result = '',
		d,
		h = moment.duration(seconds * 1000).hours(),
		m = moment.duration(seconds * 1000).minutes(),
		s = moment.duration(seconds * 1000).seconds();
	
	d = Math.floor( seconds * 1000 / 86400000 );
	h = $.trim(h).length === 1 ? '0' + h : h;
	m = $.trim(m).length === 1 ? '0' + m : m;
	s = $.trim(s).length === 1 ? '0' + s : s;
	// show how many hours, minutes and seconds are left
	if(d>0) {
		result += "<span class='days'>"+d+i18next.t("DayLabel")+"</span> ";
	}
	result += "<span class='hour'>"+h+"</span>:";
	result += "<span class='min'>"+m+"</span>:";
	result += "<span class='sec'>"+s+"</span>";
	
	return result;
}

function renderSecondsIntoHM(seconds) {
	var result = '',
		h,
		m = moment.duration(seconds * 1000).minutes();
	h = Math.floor( seconds * 1000 / 3600000 );
	m = $.trim(m).length === 1 ? '0' + m : m;
	result += "<span class='hour'>"+h+i18next.t("h.")+"</span> ";
	result += "<span class='min'>"+m+i18next.t("m.")+"</span> ";
	return result;
}

function Countdown(options) {
	var instance = this,
		seconds = options.seconds || 10,
		updateStatus = options.onUpdateStatus || function () {},
		counterEnd = options.onCounterEnd || function () {};
	
	function decrementCounter() {
		updateStatus(seconds);
		if (seconds === 0) {
			counterEnd();
			instance.stop();
		}
		seconds--;
	}
	
	this.start = function () {
		clearInterval(window.loginCountdown);
		window.loginCountdown = 0;
		seconds = options.seconds;
		window.loginCountdown = setInterval(decrementCounter, 1000);
	};
	
	this.stop = function () {
		clearInterval(window.loginCountdown);
	};
}

function jsUcfirst(string)
{
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function setCapsLockState (bool) {
	//for use in login form later
}

//Callback при масштабировании окна кнопками
function onChangeWindowState(state) {
	if('Normal'==state) {
		w_maximize.removeClass('maximized');
	}
	if('Maximized'==state) {
		w_maximize.addClass('maximized');
	}
	if('Minimized'==state) {
	
	}
}

function setLauncherUpdateState(state) {

}

function setLauncherUpdateProgress(progress) {
	drawLauncherProgress(progress);
}


function widgetProgressBarProgress(value) { //float value in (0%, 100%)
	var widgetSlider = $('[progress-bar] .slider'),
		width;
	try {
		var min_width = parseInt(widgetSlider.css('min-width')),
			total_width = parseInt(widgetSlider.parent().width()),
			effects = widgetSlider.find('.effect');

		width = total_width*value/100;
		if(width<min_width) {
			width = min_width+1;
		}

		if(value>30 && value<50) {
			var diapason = 50-30,
				dif = 50 - value,
				opacity;
			opacity = 1-dif/diapason;
			effects.css({'opacity': opacity});
		} else if (value>=50) {
			effects.css({'opacity': 1});
		} else if(value<=30) {
			effects.css({'opacity': 0});
		}

		widgetSlider.css({"width":parseInt(width)+'px'});
	} catch (e) {
		console.log(e);
	}
	return width;
}

function drawLauncherProgress(value) { //float value in (0%, 100%)
	var width;
	try{
		var min_width = parseInt(launcher_progress_bar.css('min-width')),
			total_width = parseInt(launcher_progress_bar.parent().width()),
			effects = launcher_progress_bar.find('.effect');
		
		if(value === 0) {
			stopSliderAnimation();
		} else {
			initSliderAnimation();
		}
		
		width = total_width*value/100;
		if(width<min_width) {
			width = min_width+1;
		}
		
		if(value>30 && value<50) {
			var diapason = 50-30,
				dif = 50 - value,
				opacity;
			opacity = 1-dif/diapason;
			effects.css({'opacity': opacity});
		} else if (value>=50) {
			effects.css({'opacity': 1});
		} else if(value<=30) {
			effects.css({'opacity': 0});
		}
		
		launcher_progress_bar.css({"width":parseInt(width)+'px'});
	} catch (e) {
		console.log(e);
	}
	return width;
}

function initSliderAnimation() {
	$('.slider_animation').removeClass('hidden');
	game_installer.find('.slider_animation .light').css('width', (91 + parseInt(game_installer.find('.slider').css('max-width'))) + "px");
	$('#progress_bar_page .slider_animation .light').css('width', (91 + parseInt($('#progress_bar_page .slider').css('max-width'))) + "px");
}
function stopSliderAnimation() {
	$('.slider_animation').addClass('hidden');
}


function refreshSelectFolder() {
	var items = [
		'[onclick*="selectGameFolder"]',
		'[onclick*="clearTempFolder"]',
		'[onclick*="selectTempFolder"]'
	];

	if((window.selectFolderGameUpdateStates.indexOf(window.condition.gameUpdateState) !== -1) && (window.selectFolderGameStates.indexOf(window.condition.gameState) !== -1)) {
		$.each(items, function (i, v) {
			$(v).removeClass('disabled');
			if(window.environment !== 'Production') {
				console.log(v+' enabled');
			}
		});
	} else {
		$.each(items, function (i, v) {
			$(v).addClass('disabled');
			if(window.environment !== 'Production') {
				console.log(v+' disabled');
			}
		});
	}
}

function refreshCheckForUpdate() {
	var items = [
		'[onclick*="checkForUpdate"]',
		'[onclick*="checkConsistency"]',
		'[onclick*="clearCache"]',
		'[onclick*="showDir"]'
	];
	
	if(window.environment !== 'Production') {
		console.log(window.condition.gameUpdateState);
		console.log(window.condition.gameState);
	}
	
	if((window.checkForUpdateGameUpdateStates.indexOf(window.condition.gameUpdateState) !== -1) && (window.checkForUpdateGameStates.indexOf(window.condition.gameState) !== -1)) {
		$.each(items, function (i, v) {
			$(v).removeClass('disabled');
			if(window.environment !== 'Production') {
				console.log(v+' enabled');
			}
		});
	} else {
		$.each(items, function (i, v) {
			$(v).addClass('disabled');
			if(window.environment !== 'Production') {
				console.log(v+' disabled');
			}
		});
	}
}

function resizeWindow(width, height) {
	if(!$.isNumeric( width )) {
		width = $('body>div').width();
	}
	if(!$.isNumeric( height )) {
		height = $('body>div').height();
	}
	
	$('body').css({width: width, height: height});
	launcher.setSize(width+2, height+2);
}


function renderBytes(bytes, type, needed) {
	try {
		if(needed === 'KB') {
			return (bytes / 1024).toFixed(0);
		} else if (needed === 'MB') {
			return (bytes / 1048576).toFixed(0);
		}
		
		if (bytes < 1048576) { //KB
			if (type === 'speed') {
				$('#game_current_speed_dimension').attr('data-i18n', "KB/sec");
				$('#game_current_speed_dimension').text(i18next.t("KB/sec"));
			} else if (type === 'size') {
				$('#game_size_dimension').attr('data-i18n', "KB");
				$('#game_size_dimension').text(i18next.t("KB"));
			}
			return (bytes / 1024).toFixed(0);
		} else { //MB
			if (type === 'speed') {
				$('#game_current_speed_dimension').attr('data-i18n', "MB/sec");
				$('#game_current_speed_dimension').text(i18next.t("MB/sec"));
			} else if (type === 'size') {
				$('#game_size_dimension').attr('data-i18n', "MB");
				$('#game_size_dimension').text(i18next.t("MB"));
			}
			return (bytes / 1048576).toFixed(0);
		}
	} catch(e) {
		console.log(e);
	}
}

function formatTime(time) {
	if(time<0) {
		return '<span data-i18n="Calculating time">'+i18next.t('Calculating time')+'</span>';
	}
	if(time>3600) {
		return '<span data-i18n="more_than_one_hour_left">'+i18next.t('more_than_one_hour_left')+'</span>';
	}
	
	var result = '<span data-i18n="left">'+i18next.t('left')+'</span>',
		sec = time,
		hours = sec/3600 ^ 0,
		minutes = (sec-hours*3600)/60 ^ 0,
		seconds = sec-hours*3600-minutes*60,
		hours_label = '<span data-i18n="pl_hours" data-i18n-options='+JSON.stringify({count: hours})+'>'+i18next.t('pl_hours', {count: hours})+'</span>',
		minutes_label = '<span data-i18n="pl_minutes" data-i18n-options='+JSON.stringify({count: minutes})+'>'+i18next.t('pl_minutes', {count: minutes})+'</span>',
		seconds_label = '<span data-i18n="pl_seconds" data-i18n-options='+JSON.stringify({count: seconds})+'>'+i18next.t('pl_seconds', {count: seconds})+'</span>';
	
	if(hours>0) {
		result += " " + hours + " " + hours_label + ", " + minutes + " " + minutes_label;
	} else if(minutes>0) {
		result += " " + minutes + " " + minutes_label;
	} else {
		result += " " + seconds + " " + seconds_label;
	}
	
	return result;
}

function initResizeListeners() {
	try {
		$(window).on('resize', function() {
			if(typeof calculateImportantResponsive === 'function') {
				calculateImportantResponsive();
			}
			if(typeof headerCollapse === 'function') {
				headerCollapse();
			}
			if(typeof headerCollapse === 'function') {
				onResizeGameServers();
			}
			
			if($("#important_news .item .blur").length){
				$("#important_news .item .blur").toggleClass("refresh");
			}
			
			
			if($("#main_content").length){
				if($( window ).height() > 750) {
					$('#main_content').removeClass('collapsed');
				} else {
					$('#main_content').addClass('collapsed');
				}
			}
		});
	} catch(e) {
		console.log(e);
	}
}


/**LOCALIZATION FUNCTIONS*/
function getTranslation(lang_name) {
	return $.ajax({
		'async': false,
		'global': false,
		'url': 'locales/'+lang_name+'/translation.json',
		'dataType': "json"
	});
}

function initLocalization(lang) {
	try {
		$.holdReady(true);
		var resources = {},
			promises = [];

		$.each(window.langs, function(code, title) {
			promises.push(getTranslation(code).done(function (data) {
				if(typeof data !== 'undefined') {
					resources[code] = {};
					resources[code].translation = data;
				} else {
					console.log('Undefined locale found ' + code);
				}
			}));
		});

		$.when.apply($, promises).catch(function (err) {
			console.log('ERROR loading locales');
			setTimeout(function () {
				launcherDisplayBrowser();
			}, 3);
		}).then(function() {
			console.log(promises);
			console.log('loaded locales resources: ' + resources);
			i18next.init({
				"debug": true,
				"lng": lang,
				"fallbackLng" : "en",
				"keySeparator": false,
				"nsSeparator": false,
				"resources": resources//,
				// "interpolation": {
				// 		format: function(value, format, lng) {
				// 		if(value instanceof Date) return moment(value).format(format);
				// 		return value;
				// 	}
				// }
			}, function(err, t) {
				$.holdReady(false);
				jqueryI18next.init(i18next, $, {
					tName: 't', // --> appends $.t = i18next.t
					i18nName: 'i18n', // --> appends $.i18n = i18next
					handleName: 'localize', // --> appends $(selector).localize(opts);
					selectorAttr: 'data-i18n', // selector for translating elements
					targetAttr: 'i18n-target', // data-() attribute to grab target element to translate (if diffrent then itself)
					optionsAttr: 'i18n-options', // data-() attribute that contains options, will load/set if useOptionsAttr = true
					useOptionsAttr: true, // see optionsAttr
					parseDefaultValueFromContent: false // parses default values from content ele.val or ele.text
				});
				window.i18nLoaded = true;
				i18next.on('languageChanged', function(lng) {
					window.settings.language = lng;
					window.lang = lng;
					moment.locale(i18nLangCode(lng));
					window.s2opt = {
						minimumResultsForSearch: Infinity,
						language: i18nLangCode(lng)
					};
					if(typeof changeContentLang === 'function') {
						changeContentLang(window.lang);
					}
					if(typeof getSupportConfiguration === 'function') {
						getSupportConfiguration();
					}
					if(typeof calculateImportantResponsive === 'function') {
						calculateImportantResponsive();
					}
					if($('#ets_content').hasClass('hidden')) {
						$('#ets_content').html('');
					}
					initTooltip();
					whenJqueryFuncAvailable('localize',  function() {
						$("body").localize();
						$("select").select2(window.s2opt);
						main_menu_collapse_width = null;
						$(window).trigger('resize');
						if(typeof refreshSiteConfig === 'function') {
							refreshSiteConfig();
						}
					});
					$('html').attr('lang', lng);
				});
				$('html').attr('lang', lang);
				moment.locale(i18nLangCode(lang));
				initTooltip();
				whenJqueryFuncAvailable('localize',  function() {
					$("body").localize();
					$("select").select2(window.s2opt);
					setTimeout(function () {
						launcherDisplayBrowser();
					}, 3);
				});
				if($('#login_page').length) {
					//TODO remove when eventWindowReady synced with WPF
					resizeWindow(null,null);
				}
			});
		});

	} catch(e) {
		console.log(e);
	}
}

function i18nLangCode(lang) {
	var i18nCode = lang;
	switch (lang) {
		case 'mx': i18nCode = 'es-MX'; break;
		case 'zh': i18nCode = 'zh-CN'; break;
	}
	return i18nCode;
}

function redrawLanguage(lng) {
	try {
		whenAvailable("i18nLoaded", function() {
			i18next.changeLanguage(lng);
		});
		$("select").select2(window.s2opt);
	} catch (e) {
		console.log(e);
	}
}

function getContentCache(key) {
	if(typeof window.contentCache[key] !== 'undefined') {
		if(window.contentCache[key]['valid'] >= Date.now()) {
			return window.contentCache[key]['data'];
		}
	}
	return null;
}

function setContentCache(key, val, valid) {
	return window.contentCache[key] = {'data': val, 'valid': valid};
}

function onSettingsUpdated(newSettings) {
	if(window.environment !== 'Production') {
		console.log(newSettings)
	}
	var langIsChanged = window.settings.language !== newSettings.language
	
	window.settings = newSettings
	
	if(typeof newSettings.configuration !== 'undefined') {
		window.environment = newSettings.configuration
	}
	if(typeof newSettings.authCenterUri !== 'undefined') {
		window.authCenterUri = cutLastSlash(newSettings.authCenterUri)
	}

	try {
		if(typeof newSettings.branches === 'object' && typeof initBranches === 'function') {
			initBranches(newSettings.branches)
		}
	} catch (e) {
		console.log(e);
	}

	if(typeof newSettings.tempFolder !== 'undefined' && typeof renderTempDir === 'function') {
		renderTempDir(newSettings.tempFolder)
	}

	if(window.selectedBranch && typeof window.selectedBranch.gameDirectory !== 'undefined' && typeof renderGameDir === 'function') {
		renderGameDir(window.selectedBranch.gameDirectory)
	}

	if(newSettings && newSettings.geoInfo) {
		setGeoInfo(newSettings.geoInfo)
	}

	if(langIsChanged) {
		redrawLanguage(newSettings.language)
	}
}

function initBranches(branches) {
	var optionsList = [];
	$.each(branches, function (i, branch) {
		if(branch.isSelected === true) {
			if(typeof onBranchChange === 'function') {
				onBranchChange(branch);
			}
			if(typeof branch.siteUri !== 'undefined') {
				window.site_url = cutLastSlash(branch.siteUri);
				if(typeof initSiteLinks === 'function') {
					initSiteLinks();
				}
			}
		}
		if(branch.isActive === true) {
			optionsList.push(branch);
		}
	});
	if(typeof renderBranchList === 'function') {
		renderBranchList(optionsList);
	}
}

function getBranch(name) {
	var result = {};
	$.each(settings.branches ?? [], function (i, branch) {
		if(branch.name === name) {
			result = branch;
		}
	});
	return result;
}

function initSiteLinks() {
	if(typeof window.authCenterUri === 'string') {
		for (let key in window.authCenterLinks) {
			let AuthLinkRoute = window.authCenterLinks[key];
			if(null === AuthLinkRoute) {
				if(typeof $('[data-link=' + key + ']').attr('href') !== "undefined") {
					$('[data-link='+key+']').parent().addClass('hidden');
				} else {
					$('[data-link='+key+']').addClass('hidden');
				}
			} else {
				if($('[data-link='+key+']').hasClass('out') || $('[data-link='+key+']').parent().hasClass('out') || $('[data-link='+key+']').find('.out').length) {
					if(typeof AuthLinkRoute !== 'undefined' && typeof $('[data-link=' + key + ']').attr('href') !== "undefined") {
						$('[data-link='+key+']').attr('href', window.authCenterUri + AuthLinkRoute).parent().removeClass('hidden');
					}
				} else {
					$('[data-link='+key+']').removeClass('hidden');
				}
			}
		}
	}
	
	if(typeof window.site_url === 'string') {
		for (let sKey in window.main_menu_links) {
			let SiteLinkRoute = window.main_menu_links[sKey];
			if(null === SiteLinkRoute) {
				if(typeof $('[data-link=' + sKey + ']').attr('href') !== "undefined") {
					$('[data-link='+sKey+']').parent().addClass('hidden');
				} else {
					$('[data-link='+sKey+']').addClass('hidden');
				}
			} else {
				if($('[data-link='+sKey+']').hasClass('out') || $('[data-link='+sKey+']').parent().hasClass('out')) {
					if(typeof SiteLinkRoute !== 'undefined' && typeof $('[data-link=' + sKey + ']').attr('href') !== "undefined") {
						$('[data-link=' + sKey + ']').attr('href', window.site_url + SiteLinkRoute).parent().removeClass('hidden');
					}
				} else {
					$('[data-link='+sKey+']').removeClass('hidden');
				}
			}
		}
	}
}

function renderGameDir(path) {
	if(typeof path === "string" && !["InstallRequired", "BuyRequired"].includes(window.condition.gameState) ) {
		if($('#gameDir').length){
			try {
				$('#gameDir').text(path.replace(window.game_dir_pregmatch,"")).removeClass('hidden');
			} catch (e) {
				console.log(e);
			}
		}
	} else {
		$('#gameDir').addClass('hidden');
	}
}

function renderTempDir(path) {
	if(typeof path === "string") {
		if($('#tempDir').length){
			try {
				$('#tempDir').text(path.replace(window.game_dir_pregmatch,"")).removeClass('hidden');
			} catch (e) {
				console.log(e);
			}
		}
	} else {
		$('#tempDir').addClass('hidden');
	}
}
/**EOF LOCALIZATION FUNCTIONS*/


function isLoginPage() {
	return !!$('#LauncherLogin').length;
}

function showLoader() {
	$('#loading').stop( true, true ).fadeIn('fast');
}
function hideLoader() {
	$('#loading').stop( true, true ).fadeOut('fast');
}
function showLoginLoader() {
	$('#loading').finish();
	$('#footContent').finish().fadeOut(100, function (e) {
		$('#footContent').addClass('hidden');
		$('#loading').hide().removeClass('hidden').fadeIn(100);
	});
}
function hideLoginLoader() {
	$('#footContent').finish();
	$('#loading').finish().fadeOut(100, function (e) {
		$('#loading').addClass('hidden');
		$('#footContent').hide().removeClass('hidden').fadeIn(100);
	});
}

function setNetworkAvailability(status) {
	if(status==true) {
		$('#head .user .status .text').attr('data-i18n', 'Online');
		$('#head .user .status .icon').removeClass('red').addClass('green');
		if(typeof GoToPage === 'function'){
			GoToPage('/network/online');
		}
	} else {
		$('#head .user .status .text').attr('data-i18n', 'Connecting...');
		$('#head .user .status .icon').removeClass('green').addClass('red');
		if(typeof GoToPage === 'function'){
			GoToPage('/network/offline');
		}
	}
	
	if($('#head .user .status .text').length){
		try {
			whenJqueryFuncAvailable('localize',  function() {
				$('#head .user .status .text').localize();
			});
		} catch(e) {
			console.log(e);
		}
	}
}


function enablePowerSave() {
	$('body').addClass('powersaving');
}
function disablePowerSave() {
	$('body').removeClass('powersaving');
	if(window.pushstreamBuffer.length > 0) {
		processPushBuffer();
	}
}

function initTooltip() {
	$('body [data-tooltip]').each(function(i,elem) {
		try {
			var key = $(this).attr('data-tooltip'),
				result;
			
			if((typeof $(this).attr('data-tooltip-i18n') === 'undefined') || ($(this).attr('data-tooltip-i18n') === true)) {
				result = i18next.t(key);
			} else {
				result = key;
			}
			
			var text = $("<div/>").html(result).text(); //strip tags
			
			$(this).attr('data-tooltip-text', text);
		} catch (e) { console.log(e); }
	});
}

/**Analitics API helpers*/
function GoToPage(url) {
	if(typeof(ga) === "function") {
		ga('set', 'page', url);
		ga('send', 'pageview');
	}
	if(typeof(yaCounter46073604) === "object") {
		yaCounter46073604.hit(url);
	}
}

function ReachGoal(action, label, page) {
	//here will be actual targets from YM and GA
	//GA target - index_click, YM targets - index_click_carousel, index_click_pinned_l, index_click_pinned_r
	var category = page || 'index';
	
	if(typeof(ga) == "function") {
		// console.log('GA sended. '+ category + '_' + label);
		ga('send', 'event', action, category, label);
	}
	if(typeof(yaCounter46073604) == "object") {
		// console.log('YA sended. '+ category + '_' + label);
		yaCounter46073604.reachGoal(category + '_' + label);
	}
}

function sendAnalyticsParams(data) {
	if(typeof data === 'object') {
		whenAvailable('yaCounter46073604',  function() {
			yaCounter46073604.params(data);
		});
	}
}

function sendAnalyticsUserParams(data) {
	if(typeof data === 'object') {
		whenAvailable('yaCounter46073604',  function() {
			yaCounter46073604.userParams(data);
		});
	}
}


function whenVkAvailable (callback) {
	var interval = 500; // ms
	window.setTimeout(function() {
		if (typeof VK.Widgets.Group === 'function') {
			callback(window[name]);
		} else {
			window.setTimeout(arguments.callee, interval);
		}
	}, interval);
}

function iframeLoaded(selector, loadedSelector, callback) {
	var interval = 500; // ms
	window.setTimeout(function() {
		if ($(selector).contents().find(loadedSelector).length) {
			callback(window[name]);
		} else {
			window.setTimeout(arguments.callee, interval);
		}
	}, interval);
}

function whenAvailable(name, callback) {
	var interval = 100; // ms
	window.setTimeout(function() {
		if (window[name]) {
			callback(window[name]);
		} else {
			window.setTimeout(arguments.callee, interval);
		}
	}, interval);
}

function whenJqueryFuncAvailable(name, callback) {
	var interval = 50; // ms
	window.setTimeout(function() {
		if (typeof $('body')[name] === "function") {
			callback();
		} else {
			window.setTimeout(arguments.callee, interval);
		}
	}, interval);
}

function isScriptLoaded(url) {
	if (!url) url = "http://xxx.co.uk/xxx/script.js";
	var scripts = document.getElementsByTagName('script');
	for (var i = scripts.length; i--;) {
		if (scripts[i].src == url) return true;
	}
	return false;
}

/**images error handler*/
function brokenImage(img) {
	var image = img || this,
		new_image = dummy_image;
	
	if($(image).parent().hasClass('avatar')) {
		new_image = dummy_avatar;
	}
	if($(image).parent().hasClass('newsItem')) {
		new_image = dummy_news_item;
	}
	
	$(image).attr('onerror', '').unbind("error").attr('src', new_image);
}

function setGeoInfo(payload) {
	return window.geoInfo = payload;
}




/**JS TOOLS*/
$.fn.textWidth = function(text, font) {
	if (!$.fn.textWidth.fakeEl) $.fn.textWidth.fakeEl = $('<span>').hide().appendTo(document.body);
	$.fn.textWidth.fakeEl.text(text || this.val() || this.text()).css('font', font || this.css('font'));
	return $.fn.textWidth.fakeEl.width();
};
$.fn.hasScrollBar = function() {
	return this.get(0).scrollHeight > this.height();
};
var PrependZeros = function (str, len) {
	if (typeof str === 'number' || Number(str)) {
		str = str.toString();
		return (len - str.length > 0) ? new Array(len + 1 - str.length).join('0') + str : str;
	}
	else {
		for (var i = 0,
			     spl = str.split(' '); i < spl.length; spl[i] = (Number(spl[i]) && spl[i].length < len) ? PrependZeros(spl[i], len) : spl[i], str = (i == spl.length - 1) ? spl.join(' ') : str, i++);
		return str;
	}
};
function isEllipsisActive(jQueryObj) {
	return (  ( jQueryObj.outerWidth() ) <= ( jQueryObj[0].scrollWidth-1 )  );
}
/**EOF JS TOOLS*/


/**TABLE SORTING FEATURES*/
// Takes a table row element and an index and returns the normalized form
// of the sort attribute for the nth-child td. To be more clear, take the
// nth-child td element inside this table row as defined by index (that is
// `:nth-child(idx)`) and then normalize it's sort attribute (if it exists)
// otherwise use the internal text.
function sort_attr ($tr, idx) {
	var $td = $tr.children("div:nth-child(" + idx + ")"),
		sort_attr = $td.attr("sort");
	if (typeof(sort_attr) === "undefined") {
		sort_attr = $td.text();
	}
	sort_attr = sort_attr.trim().toLowerCase();
	return sort_attr;
}
function sortAlphaNum(a,b) {
	var reA = /[^a-zA-Z]/g;
	var reN = /[^0-9]/g;
	var AInt = parseInt(a, 10);
	var BInt = parseInt(b, 10);
	
	if(isNaN(AInt) && isNaN(BInt)){
		var aA = a.replace(reA, "");
		var bA = b.replace(reA, "");
		if(aA === bA) {
			var aN = parseInt(a.replace(reN, ""), 10);
			var bN = parseInt(b.replace(reN, ""), 10);
			return aN === bN ? 0 : aN > bN ? 1 : -1;
		} else {
			return aA > bA ? 1 : -1;
		}
	}else if(isNaN(AInt)){
		return 1;
	}else if(isNaN(BInt)){
		return -1;
	}else{
		return AInt > BInt ? 1 : -1;
	}
}
// Returns a sorting function that can be applied to an array.
function _sort (idx, ascending) {
	return ascending ? function _sorter (a, b) {
		return sortAlphaNum(sort_attr($(a), idx), sort_attr($(b), idx));
	} : function _sorter (a, b) {
		return sortAlphaNum(sort_attr($(b), idx), sort_attr($(a), idx));
	}
}
/**EOF TABLE SORTING FEATURES*/


//разделить тысячи пробелами
function formatSpaces(num){
	var n = num.toString(), p = n.indexOf('.');
	return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function($0, i){
		return p<0 || i<p ? ($0+' ') : $0;
	});
}

//Удалить у урла последний "/"
function cutLastSlash(site)
{
	if(typeof site === "string") {
		site = site.replace(/\/$/, "");
	}
	return site;
}

function setCookie(name, value, options) {
	options = options || {};
	
	var expires = options.expires;
	
	if (typeof expires == "number" && expires) {
		var d = new Date();
		d.setTime(d.getTime() + expires * 1000);
		expires = options.expires = d;
	}
	if (expires && expires.toUTCString) {
		options.expires = expires.toUTCString();
	}
	
	value = encodeURIComponent(value);
	
	var updatedCookie = name + "=" + value;
	
	for (var propName in options) {
		updatedCookie += "; " + propName;
		var propValue = options[propName];
		if (propValue !== true) {
			updatedCookie += "=" + propValue;
		}
	}
	
	document.cookie = updatedCookie;
}

function IsJsonString(str) {
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	return true;
}

function mask(value, symbol = '*') {
	if (value.length < 4) {
		return value;
	}
	const symbolsToHide = value.length * 0.5;
	const offset = Math.floor(symbolsToHide / 2);
	const start = value.slice(0, offset);
	const end = value.slice(-offset);
	return start + symbol.repeat(value.length - symbolsToHide) + end;
}

function maskEmail(email, symbol = '*') {
	try {
		const [value, domain] = email.split('@');
		email = mask(value, symbol);
		if (domain) {
			email += `@${domain}`;
		}
	} catch (e) {
		return email;
	}
	return email;
}

let delay = (function(){
	let timer = 0
	return function(callback, ms){
		clearTimeout (timer)
		timer = setTimeout(callback, ms)
	}
})()