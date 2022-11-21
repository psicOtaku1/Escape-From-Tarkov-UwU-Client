/**
 * Created by vitekvil on 10.05.2017.
 */
$(document).ready( function () {
	console.log('MainWindowJqueryDocumentReadyEventFired');
	whenAvailable('launcher',function () {
		try {
			Blur("#head .background");

			$(document).on('click', '[data-news]', function(e) {
				e.preventDefault();
				showNews($(this).attr('data-news'));
			});

			head_user_block.click(function(e){
				if(user_menu.hasClass('hidden')) {
					user_menu.hide().removeClass('hidden').fadeIn('fast');
				} else {
					user_menu.fadeOut('fast', function(e) {
						user_menu.addClass('hidden');
					});
				}
			});
			$("#head>.wrap>.menu>ul").click(function(e){
				if(mobile_menu.hasClass('hidden')) {
					mobile_menu.hide().removeClass('hidden').fadeIn('fast');
				} else {
					mobile_menu.fadeOut('fast', function(e) {
						mobile_menu.addClass('hidden');
					});
				}
			});

			//Язык открыли и кликаем не в него язык закрывается
			$("html").click(function(event) {
				if ($(event.target).closest('#head .user').length === 0) {
					user_menu.fadeOut('fast', function(e) {
						user_menu.addClass('hidden');
					});
				}
				if ($(event.target).closest('#selectedBranchName').length === 0) {
					$('#selectedBranchName').fadeOut('fast').removeClass('visible');
					$('#selectedBranch').removeClass('opened');
				}
				if ($(event.target).closest('#head .menu>ul').length === 0) {
					mobile_menu.fadeOut('fast', function(e) {
						mobile_menu.addClass('hidden');
					});
				}
				if ($(event.target).closest('#news_item>.container>.sharing>.right>.sharer>i, #news_item>.container>.sharing>.right>.sharer>span').length === 0) {
					$('#news_item>.container>.sharing>.right>.sharer>ul').fadeOut('fast', function(e) {
						$('#news_item>.container>.sharing>.right>.sharer>ul').addClass('hidden');
					});
				}
			});

			game_main.find('.block .right .button').click(function(e){
				var action = $(this).attr('data-main-button');

				GoToPage('/game/'+action);

				switch (action) {
					case "install":
						installGame();
						break;
					case "start":
						if(!$(this).hasClass('disabled')) {
							startGame();
						}
						break;
					case "update":
						updateGame();
						break;
					case "pause":
						pauseInstallation();
						break;
					case "buy":
						break;
					case "repair":
						repairGame();
						break;
					case "ingame":
						break;
					case "inqueue":
						cancelGameQueue();
						break;
					default:
					//Unknown state
				}
			});
			$('#game_installing [data-main-button]').click(function(e){
				var action = $(this).attr('data-main-button');

				GoToPage('/game/'+action);

				switch (action) {
					case "pause":
						pauseInstallation();
						break;
					case "play":
						renderPauseStateBuffer();
						resumeInstallation();
						break;
					case "stop":
						stopInstallation();
						break;
					default:
					//Unknown state
				}
			});
		} catch (e) {
			console.log(e);
		}
	});
});



/*LAUNCHER FUNCTIONS*/
function resetGameUpdate(state) {
	hideMenuDownloading();
	game_installer.find('.notes').removeClass('hidden');
	game_installer.find('#time_left_block').removeClass('hidden');
	game_installer.find('.pause').addClass('hidden');
	game_installer.find('.play').addClass('hidden');
	game_installer.find('.stop').addClass('hidden');
	game_installer.find('.notes>.left').removeClass('hidden');
	game_installer.find('.progress').removeClass('wide');
	game_installer.find('.slider_animation').addClass('hidden');
	game_installer.find('.slider_animation .light').css('left', '0');
	game_installer.find('#game_current_speed').removeClass('hidden');
	game_installer.find('#game_current_percent').addClass('hidden');
	$('#time_left_block').removeClass('hidden');
	game_installer.removeClass('shrink');
	game_time_left.html(null);
	if(state !== "Pause" && state !== 'DownloadingUpdate') {
		drawGameProgress(0);
		game_size_left.text(0);
		game_size_total.text(0);
		$('#game_size_dimension').text('');
		$('#game_current_speed .value').text(0);
		$('#game_current_percent .value').text(0);
		$('#game_current_speed_dimension').text('');
	}
}

function hideGameBlocks(callback) {
	game_installer.addClass('hidden');
	game_main.addClass('hidden');
	top_button_check_updates.removeClass('blinking');
	top_button_check_updates.find('span').attr('data-i18n', 'Check for updates');
	whenJqueryFuncAvailable('localize',  function() {
		top_button_check_updates.localize();
	});
	if (typeof callback === "function") {
		callback();
	}
	refreshSelectFolder();
	refreshCheckForUpdate();
	refreshBranchSelectorState();
}

function setGameUpdateState(state) {
	window.condition.gameUpdateState = state;
	GoToPage('/game/update/'+state);
	hideGameBlocks(function(){
		resetGameUpdate(state);
		switch (state) {
			case "Idle":
				if(!playButtonForceLocked) {
					game_install_button.removeClass('disabled');
				}
				game_main.removeClass('hidden');
				break;
			case "CheckingForUpdate":
				game_installer.addClass('hidden');
				game_main.removeClass('hidden');
				game_installer.find('.pause').removeClass('hidden');
				game_installer.find('.stop').removeClass('hidden');
				top_button_check_updates.find('span').attr('data-i18n', "Searching for updates");
				top_button_check_updates.addClass('blinking');
				game_install_button.addClass('disabled');
				whenJqueryFuncAvailable('localize',  function() {
					$('body').localize();
				});
				break;
			case "DownloadingUpdate":
				$('#install_state_text').attr("data-i18n", "Downloading files");
				game_installer.find('.pause').removeClass('hidden');
				game_installer.find('.stop').removeClass('hidden');
				showMenuDownloading();
				game_installer.removeClass('hidden');
				break;
			case "Pause":
				$('#install_state_text').attr("data-i18n", "Downloading files");
				game_installer.find('.play').removeClass('hidden');
				game_installer.find('.stop').removeClass('hidden');
				showMenuDownloading();
				setGameUpdateSpeed(0);
				game_installer.removeClass('hidden');
				break;
			case "CheckingUpdateHash": //Check update hash(MD5)
				$('#install_state_text').attr("data-i18n", "Checking");
				showMenuDownloading();
				game_installer.find('.progress').addClass('wide');
				game_installer.removeClass('hidden');
				break;
			case "InstallingUpdate":
				game_installer.find('.pause').addClass('hidden');
				game_installer.find('.notes>.left').addClass('hidden');
				game_installer.find('#time_left_block').addClass('hidden');
				$('#install_state_text').attr("data-i18n", "Unpacking game files...");
				game_installer.find('#game_current_speed').addClass('hidden');
				game_installer.find('#game_current_percent').removeClass('hidden');
				game_installer.find('.progress').addClass('wide');
				showMenuDownloading();
				game_installer.removeClass('hidden');
				break;
			case "UpdateError":
				game_main.removeClass('hidden');
				break;
			case "ConsistencyChecking":
				game_installer.find('.pause').addClass('hidden');
				game_installer.find('.notes>.left').addClass('hidden');
				game_installer.find('#time_left_block').addClass('hidden');
				$('#install_state_text').attr("data-i18n", "Checking the integrity of game files...");
				showMenuDownloading();
				game_installer.find('#game_current_speed').addClass('hidden');
				game_installer.find('#game_current_percent').removeClass('hidden');
				game_installer.find('.progress').addClass('wide');
				game_installer.removeClass('hidden');
				break;
			case "RepairingGame":
				game_installer.find('.pause').addClass('hidden');
				game_installer.find('.notes>.left').addClass('hidden');
				game_installer.find('#time_left_block').addClass('hidden');
				$('#install_state_text').attr("data-i18n", "Repairing the game...");
				showMenuDownloading();
				game_installer.find('#game_current_speed').addClass('hidden');
				game_installer.find('#game_current_percent').removeClass('hidden');
				game_installer.find('.progress').addClass('wide');
				game_installer.removeClass('hidden');
				break;
			default:
			//Unknown state
		}
		try {
			whenJqueryFuncAvailable('localize',  function() {
				game_installer.localize();
			});
		} catch(e) {
			console.log(e);
		}
	});
}

function hideSubMenu() {
	game_main.find('.bottom_buttons').slideUp('fast', function(e) {
		game_main.find('.bottom_buttons').addClass('hidden');
	});
}
function showSubMenu() {
	game_main.find('.bottom_buttons').hide().removeClass('hidden').slideDown('fast');
}

function resetGameBlock() {
	if(!playButtonForceLocked) {
		clearInterval(window.loginCountdown);
		window.loginCountdown = 0;
		game_main.find('[data-countdown]').remove();
		game_install_button.removeClass('disabled');
	}
	game_main.find('.block').removeClass('error');
	game_main.find('.reinstall_error').addClass('hidden');
	game_main.find('.game_queue').addClass('hidden');
	game_main.find('.reinstall_error .mes_3').attr('data-i18n', 'Complete reinstall required.');
	game_main.find('.game_info').removeClass('hidden');
	game_main.find('.top_buttons').css({visibility: "visible"});
	game_main.find('[data-type="version"] .error').remove();
	game_install_button.removeClass('patch');
	if(typeof game_install_button.parent().attr('href') !== 'undefined') {
		game_install_button.unwrap();
	}
	top_button_select_folder.removeClass('hidden');
	top_button_check_updates.addClass('hidden');
	top_button_check_updates.removeClass('blinking');
	top_button_check_updates.find('span').attr('data-i18n', 'Check for updates');
	whenJqueryFuncAvailable('localize',  function() {
		top_button_check_updates.localize();
	});
	refreshSelectFolder();
	hideSubMenu();
	refreshBranchSelectorState();
}

function setGameState(state) {
	window.condition.gameState = state;
	GoToPage('/game/state/'+state);
	disablePowerSave();
	hideGameBlocks(function() {
		resetGameBlock();
		switch (state) {
			case "InstallRequired":
				game_install_button.find('.main_text').html('<i class="icon install"></i><span data-i18n="Install"></span>');
				game_install_button.attr("data-main-button", 'install');
				game_main.removeClass('hidden');
				break;
			case "BuyRequired":
				game_install_button.find('.main_text').html('<i class="icon buy"></i><span data-i18n="Buy"></span>');
				setGameInfo('not_purchased', '<span data-i18n="Not installed"></span>', '<span data-i18n="empty"></span>');
				game_install_button.attr("data-main-button", 'buy');
				game_install_button.wrapAll("<a href='"+window.site_url+"/preorder-page' data-link='preorder' target='_blank'></a>");
				game_main.removeClass('hidden');
				break;
			case "UpdateRequired":
				top_button_select_folder.addClass('hidden');
				top_button_check_updates.addClass('hidden');
				if(!game_main.find('[data-type="version"] .error').length) {
					var current_version = game_main.find('[data-type="version"]').text();
					game_main.find('[data-type="version"]').html(current_version+" <span class='error' data-i18n='Outdated!'></span>");
				}
				game_install_button.addClass('patch').find('.main_text').html('<div class="top"><span data-i18n="Patch detected"></span></div><i class="icon install"></i><span data-i18n="Update"></span>');
				game_install_button.attr("data-main-button", 'update');
				game_main.removeClass('hidden');
				break;
			case "ReadyToGame":
				top_button_select_folder.addClass('hidden');
				top_button_check_updates.removeClass('hidden');
				game_install_button.find('.main_text').html('<i class="icon man"></i><span data-i18n="Play"></span>');
				game_install_button.attr("data-main-button", 'start');
				game_main.removeClass('hidden');
				break;
			case "PreparingForGame":
				game_install_button.addClass('disabled');
				top_button_select_folder.addClass('hidden');
				top_button_check_updates.find('span').attr('data-i18n', "Checking game");
				top_button_check_updates.removeClass('hidden');
				top_button_check_updates.addClass('blinking');
				game_install_button.attr("data-main-button", 'start');
				whenJqueryFuncAvailable('localize',  function() {
					$('body').localize();
				});
				game_main.removeClass('hidden');
				break;
			case "InQueue":
				game_install_button.find('.main_text').html('<i class="icon queue"></i><span data-i18n="Cancel"></span>');
				game_main.find('.top_buttons').css({visibility: "hidden"});
				game_main.find('.game_info').addClass('hidden');
				game_main.find('.game_queue').removeClass('hidden');
				game_install_button.attr("data-main-button", 'inqueue');
				game_main.removeClass('hidden');
				showSubMenu();
				break;
			case "InGame":
				game_install_button.addClass('disabled');
				game_install_button.find('.main_text').html('<i class="icon man"></i><span data-i18n="In game"></span>');
				game_main.find('.top_buttons').css({visibility: "hidden"});
				game_install_button.attr("data-main-button", 'ingame');
				game_main.removeClass('hidden');
				enablePowerSave();
				break;
			case "ReinstallRequired":
				game_install_button.find('.main_text').html('<i class="icon cloud"></i><span data-i18n="Reinstall"></span>');
				game_main.find('.block').addClass('error');
				game_main.find('.reinstall_error').removeClass('hidden');
				game_main.find('.game_info').addClass('hidden');
				game_install_button.attr("data-main-button", 'install');
				game_main.removeClass('hidden');
				break;
			case "RepairRequired":
				game_install_button.find('.main_text').html('<i class="icon cloud"></i><span data-i18n="Repair"></span>');
				game_main.find('.block').addClass('error');
				game_main.find('.reinstall_error .mes_3').attr('data-i18n', 'Repair required.');
				game_main.find('.reinstall_error').removeClass('hidden');
				game_main.find('.game_info').addClass('hidden');
				game_install_button.attr("data-main-button", 'repair');
				game_main.removeClass('hidden');
				break;
			default:
		}
		try{
			whenJqueryFuncAvailable('localize',  function() {
				game_main.localize();
				$(window).trigger('resize');
			});
		} catch(e) {
			console.log(e);
		}
	});
}


function drawMainButtonCountdown(sec, disableMainButton) {
	var addDisabledClass = disableMainButton || false;
	if(sec>0) {
		if(addDisabledClass) {
			playButtonForceLocked = true;
			game_install_button.addClass('disabled');
		}
		game_install_button
			.addClass('patch')
			.find('.main_text')
			.html('<div class="top"><span data-countdown>' + renderSeconds(sec) + '</span></div><i class="icon man"></i><span data-i18n="Play"></span>');
		$('#game_main').localize();
		new Countdown({
			seconds: sec-1,  // number of seconds to count down
			onUpdateStatus: function(sec){
				game_install_button.find('.main_text [data-countdown]').html(renderSeconds(sec));
			}, // callback for each second
			onCounterEnd: function(){
				clearInterval(window.loginCountdown);
				playButtonForceLocked = false;
				setGameState("ReadyToGame");
			} // final action
		}).start();
	} else {
		setGameState("ReadyToGame");
	}
}


function drawQueueValues(place, approx) {
	$('[data-queue]').each(function (i, v) {
		switch ($(this).attr('data-queue')) {
			case 'place':
				if(-1 === parseInt(place)) {
					$(this).html('...');
				} else {
					$(this).html(place);
				}
				break;
			case 'approx':
				if(-1 === parseInt(approx)) {
					$(this).html('<span data-i18n="counting_time">'+i18next.t('counting_time')+'</span>');
				} else {
					if(approx<60) {
						$(this).html('<span data-i18n="less_than_minute">'+i18next.t('less_than_minute')+'</span>');
					} else {
						$(this).html(renderSecondsIntoHM(approx));
					}
				}
				break;
			default:
				$(this).html('');
				break;
		}
	});
}

function setGameUpdateVersion(version) {
	var patch_version = game_install_button.find('.top .version');
	if(patch_version.length) {
		patch_version.text(' '+version);
	} else if ('null'!==version) {
		game_install_button.find('.top').append("<span class='version'> "+version+"</span>");
	}
}

function setGameUpdateProgress(current_size, total_size, time_left, current_speed) {
	try {
		setPauseStateBuffer(current_size, total_size, time_left, current_speed);
		game_time_left.html(formatTime(time_left));
		game_size_total.text(formatSpaces(renderBytes(total_size, 'size')));
		var gameSizeLeftText = formatSpaces(renderBytes(current_size, 'size', $('#game_size_dimension').attr('data-i18n'))),
			zeroesString = '0'.repeat(gameSizeLeftText.length),
			zeroesWidth = $('<span>'+zeroesString+'</span>').textWidth();

		game_size_left.text(gameSizeLeftText).css('width', zeroesWidth);
		setGameUpdateSpeed(current_speed);
		drawGameProgress(current_size*100/total_size);
	} catch(e) {
		console.log(e);
	}
}

function setPauseStateBuffer(current_size, total_size, time_left, current_speed) {
	pauseStateBuffer = {
		'current_size': current_size,
		'total_size': total_size,
		'time_left': time_left,
		'current_speed': current_speed,
	};
}

function renderPauseStateBuffer() {
	setGameUpdateProgress(
		pauseStateBuffer.current_size,
		pauseStateBuffer.total_size,
		pauseStateBuffer.time_left,
		pauseStateBuffer.current_speed
	);
}

function setGameUpdateSpeed(current_speed) {
	try {
		if((window.condition.gameUpdateState === "Pause")) {
			game_current_speed.find('.value').text('');
			$('#game_current_speed_dimension').attr('data-i18n', "Paused");
			$('#game_current_speed_dimension').text(i18next.t("Paused"));
		} else if((window.condition.gameUpdateState !== "Pause") && (current_speed > 0)) {
			game_current_speed.find('.value').text(formatSpaces(renderBytes(current_speed, 'speed')));
		} else {
			game_current_speed.find('.value').text('');
			$('#game_current_speed_dimension').attr('data-i18n', "Waiting");
			$('#game_current_speed_dimension').text(i18next.t("Waiting"));
		}
	} catch(e) {
		console.log(e);
	}
}




/*FRONTEND FUNCTIONS*/
function renderBackground(page) {
	if($('#main_content').length && $('#settings_content').length) {
		try {
			var branch = "default",
				url = 'MOD/custom_bg/main_art.jpg',
				bgposition = 'center top';

			if(
				typeof window.selectedBranch === 'object' &&
				window.selectedBranch.name !== "live" &&
				typeof window.pageParams['branch'][window.selectedBranch.name] !== "undefined"
			) {
				branch = window.selectedBranch.name;
			}
			if(typeof window.pageParams['branch'][branch][page]['img'] === "string") {
				url = window.pageParams['branch'][branch][page]['img'];
			}
			if(typeof window.pageParams['branch'][branch][page]['imgPos'] === "string") {
				bgposition = window.pageParams['branch'][branch][page]['imgPos'];
			}

			$('#page').css({
				"background": "url("+url+") no-repeat "+bgposition+" fixed"
			});
			//generate blur
			Blur("#head .background");
		} catch (e) {
			console.log(e);
		}
	}
}
function Blur(selector) {
	var $item = $(selector),
		$blur = $(selector).find(".blur"),
		svg_blur = "url(#blur)";
	if(!$blur.length) {
		$item.append('<div class="blur"></div>');
		$blur = $(selector).find(".blur")
	}
	if($item.hasClass('blurer')) {
		svg_blur = "url(#important_blur)";
	}
	$blur.css({
		"background": $('#page').css('background'),
		//"filter": "blur(10px)",
		"filter": svg_blur,
		"position": "absolute",
		"top": "-20px",
		"left": "-10px",
		"right": "-10px",
		"bottom": "-30px",
		"will-change": "auto",
		"z-index": "-1",
		"transform": "translateZ(0)"
	});
	$item.css({"overflow":"hidden"});
}
function drawGameProgress(value) { //value in (0%, 100%)
	value = +value || 0
	var width,
		min_width = parseInt(progress_bar.css('min-width')),
		total_width = parseInt(progress_bar.parent().width()),
		effects = progress_bar.find('.effect'),
		percent = parseInt(value);

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

	if(!$('#game_current_percent').hasClass('hidden') && (0<value)) {
		$('#game_current_percent .value').text(percent);
	}

	if(main_menu_game_item.find('.percent').length) {
		main_menu_game_item.find('.percent').text(percent+'%');
		main_menu_game_item.find('.slider').css({width:value+"%"});
	}

	progress_bar.css({"width":parseInt(width)+'px'});
	return width;
}



function showMenuDownloading() {
	main_menu_game_item.addClass('downloading');
	main_menu_game_item.html('<span class="icon"></span><span data-i18n="Game"></span><span class="percent"></span><span class="slider"></span>');
	try {
		whenJqueryFuncAvailable('localize',  function() {
			main_menu_game_item.localize();
		});
	} catch (e) {
		console.log(e);
	}
}
function hideMenuDownloading() {
	main_menu_game_item.removeClass('downloading');
	var current_text = main_menu_game_item.find('[data-i18n="Game"]').text();
	main_menu_game_item.html('<span data-i18n="Game">'+current_text+'</span>');
	try {
		whenJqueryFuncAvailable('localize',  function() {
			main_menu_game_item.localize();
		});
	} catch (e) {
		console.log(e);
	}
}

//разделить тысячи пробелами
function formatSpaces(num){
	var n = num.toString(), p = n.indexOf('.');
	return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function($0, i){
		return p<0 || i<p ? ($0+' ') : $0;
	});
}

function renderPage(page) {
	try {
		GoToPage('/page/'+page);
		//clean news item page
		$('#news_item').addClass('hidden').html('');

		try {
			if(news_carousel) {
				news_carousel.slick('slickPause');
			}
			if(main_carousel) {
				main_carousel.slick('slickPause');
			}
		} catch (e) {console.log(e);}

		pauseAllVideos();
		$('#foot').addClass('hidden');
		$('#page>.content').addClass('hidden');
		main_menu.find('li').removeClass('active');
		$('#important_news').addClass('hidden');
		$('#news_item').addClass('hidden').html('');
		renderBackground(page);
		switch (page) {
			case "news":
				initNewsPage(window.lang);
				//set bg
				main_menu.find('li.news').addClass('active');
				//show content
				$('#news_content').removeClass('hidden');
				if (current_page == page) {
					$('#news_content').animate({scrollTop: 0}, 'fast');
				}
				if (!$('#news_content').hasScrollBar()) {
					appendNewsPage();
				}
				break;
			case "settings":
				//set bg
				main_menu.find('li.settings').addClass('active');
				//show content
				if (!$.trim($('#settings_content').html()).length) {
					$.get('settings.html', function (data) {
						$('#settings_content').html(data).promise().then(function () {
							$.each(window.langs, function(code, title) {
								$('#language')
									.append($("<option></option>")
										.attr("value",code)
										.text(title));
							});
							$("select").select2(window.s2opt);
							try {
								launcher.getSettings().then(function (data) {
									data = $.parseJSON(data);
									for (var i in data) {
										var val = data[i],
											input = $('#' + i);
										switch (input.attr('type')) {
											case 'checkbox':
												if (true == val) {
													input.attr('checked', 'checked');
												} else {
													input.removeAttr('checked');
												}
												break;
											case 'select':
												input.val(val).select2(window.s2opt);
												break;
											default:
												input.val(val);
												break;
										}
									}
									if(typeof onSettingsUpdated === 'function') {
										onSettingsUpdated(data);
									}
								}).then(function () {
									if (document.getElementById('launchOnStartup').checked) {
										$('#launchMinimized').removeAttr('disabled');
									} else {
										$('#launchMinimized').attr('disabled', 'disabled');
									}
									if (document.getElementById('saveLogin').checked) {
										$('#keepLoggedIn').removeAttr('disabled');
									} else {
										$('#keepLoggedIn').attr('disabled', 'disabled');
									}

									$('#maxDownloadSpeed').keyup();
									$('#settings_content').removeClass('hidden');

									refreshSelectFolder();
									renderGameDir(window.selectedBranch.gameDirectory);

									try {
										whenJqueryFuncAvailable('localize',  function() {
											$('#settings').localize();
											$("select").select2(window.s2opt);
											$('input[type="range"]').ionRangeSlider(window.ionSliderDefaultConfig);
										});
									} catch (e) {
										console.log(e);
									}
								});
							} catch (e) {
								console.log(e);
							}
							refreshBranchSelectorState();
						});
					});
				} else {
					$('#settings_content').removeClass('hidden');
				}
				break;
			case "ets":
				//set bg
				main_menu.find('li.ets').addClass('active');
				//show content
				if (!$.trim($('#ets_content').html()).length) {
					loadEtsPage(window.lang);
				} else {
					$('#ets_content').removeClass('hidden');
				}
				break;
			default:
				main_menu.find('li.game').addClass('active');
				$('#important_news').removeClass('hidden');
				$('#main_content').removeClass('hidden');
				$('#foot').removeClass('hidden');
				reCalculateImportantNews();
		}

		$(window).trigger('resize');
		current_page = page;
	} catch(e) {
		console.log(e)
	}
}

function loadEtsPage(lang) {
	if($('#ets_content').length) {
		siteRequest('ets/info/'+lang, {}, function(response) {
			response = JSON.parse(response);
			try {

				if(typeof response.status !== 'undefined') {
					setUserETSStatus(response.status);
				}

				$('#ets_content').html('<div class="container small">'+'<div class="title">'+response.title+'</div>'+response.content+'</div>').promise().done(function(){
					$("#sign_ets_nda").on('change', function (e) {
						if($("#sign_ets_nda").is(':checked')) {
							$('[data-action="etsSignup"]').removeClass('disabled');
						} else {
							$('[data-action="etsSignup"]').addClass('disabled');
						}
					});
					$('#ets_content').removeClass('hidden');
					showUserEtsStatus(response.status);

					$("[data-action='etsSignup']").on('click', function (e) {
						e.preventDefault();
						if(!$(this).hasClass('disabled')) {
							if(!checkETSRequirenments()) {
								try {
									var code = 304013,
										args = [''+window.siteConfig.etsMaxProfileLevel, ''+window.siteConfig.etsMaxGamePurchaseMonths],
										message = i18next.t("error_msg_"+code, {args: args});
									launcher.showCodeError(code, message, args);
								} catch (e) {
									console.log(e);
								}
							} else {
								$("[data-status]:not(.hidden)").fadeOut('fast', function(e) {
									$("[data-status]").addClass('hidden');
									siteRequest('ets/signup', {}, function(signupResponse) {
										signupResponse = JSON.parse(signupResponse);
										if(typeof signupResponse.status !== 'undefined') {
											setUserETSStatus(signupResponse.status);
										}
									});
								});
							}
						}
					});
				});

			} catch (e) {
				console.log(e);
			}
		});
	}
}

function checkETSRequirenments() {
	try {
		return (
			settings['profileLevel'] >= window.siteConfig.etsMaxProfileLevel
			&&
			parseInt(settings['purchaseDate']) < moment().subtract(window.siteConfig.etsMaxGamePurchaseMonths, 'months').unix()
		);
	} catch (e) {
		return false;
	}
}

function showUserEtsStatus(status) {
	$("[data-status]").addClass('hidden');
	$("[data-status='"+status+"']").hide().removeClass('hidden').fadeIn('fast');
	refreshETSMenuBlinking(status);
}

function refreshETSMenuBlinking(status) {
	let menu = $("#head>.wrap>.menu>ul>li[data-link=ets]");
	if(status === 0 && checkETSRequirenments()) {
		menu.addClass('blinking');
	} else {
		menu.removeClass('blinking');
	}
}

function initCarousels(lang) {
	if(typeof lang === "string") {
		var cacheKey = 'carousel_'+window.selectedBranch.name+'_'+lang,
			data = getContentCache(cacheKey);
		if(null === data) {
			siteRequest('media/'+lang, {}, function(result) {
				result = JSON.parse(result);
				if(typeof result.data === 'object') {
					setContentCache(cacheKey, result.data, Date.now()+window.contentCacheInterval);
					renderMainCarousel(result.data);
					renderNewsCarousel(result.data);
				}
			});
		} else {
			renderMainCarousel(data);
			renderNewsCarousel(data);
		}
	}
}

function renderMainCarousel(data) {
	try {
		$("#main_news>.carousel").html(getCarouselHtml(data, "video_", "ico"));
		//init slick carousel
		main_carousel = $('#main_news .carousel>ul');
		main_carousel.on('init', function(slick){
			window.setTimeout(function() {
				$("#main_news>.carousel").removeClass('pointedOut');
			}, 500);
		});
		main_carousel.slick(main_slick_config);
		main_carousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){
			$.each(main_carousel.find('li.slick-slide'), function( index, value ) {
				$(value).find('iframe').addClass('hidden');
				if(video_players[$(value).attr('id')] && $(value).find('iframe').length) {
					try {
						video_players[$(value).attr('id')].pauseVideo();
					} catch(e){
						console.log(e);
					}
				}
			});
		});
		initVideoHandler();
	} catch (e) {
		console.log(e);
	}
}

function renderNewsCarousel(data) {
	try {
		$("#news_list>.carousel").html(getCarouselHtml(data, "news_video_", "ico_big"));
		//init slick carousel
		news_carousel = $('#news_list .carousel>ul');
		news_carousel.slick(news_slick_config);

		var $dots = $( '#news_list .slick-dots' ),
			activeClass = 'slick-active',
			ariaAttribute = 'aria-hidden';

		news_carousel.on('beforeChange', function(event, slick, currentSlide, nextSlide){
			$.each(news_carousel.find('li.slick-slide'), function( index, value ) {
				$(value).find('iframe').addClass('hidden');
				if(video_players[$(value).attr('id')] && $(value).find('iframe').length) {
					try {
						video_players[$(value).attr('id')].pauseVideo();
					} catch(e){
						console.log(e);
					}
				}
			});
			$( 'li', $dots ).removeClass( activeClass ).attr( ariaAttribute, true );
		}).on( 'afterChange', function( event, slick, currentSlide ) {
			$dots.each( function() {
				$( 'li', $( this ) ).eq( currentSlide ).addClass( activeClass ).attr( ariaAttribute, false );
			} );
		});
	} catch (e) {
		console.log(e);
	}
}

function getCarouselHtml(data, idKey, icoProp) {
	var carousel=$("<ul class='slick-slider'></ul>");
	$.each( data, function( key, val ) {
		if(typeof val.type === "undefined" || parseInt(val.type) === 2) {
			carousel.append($("<li id='"+idKey+key+window.lang+"' class='slick-slide'></li>").html(
				'<img src="'+val[icoProp]+'" onerror="$(this).remove()" alt="'+val.header+'" />'+
				'<div class="caption">'+val.header+'</div>'+
				'<div class="play" onclick="playVideo(\''+idKey+key+window.lang+'\')" data-video="'+val.link+'"></div>'
			));
		} else if(parseInt(val.type) === 4) {
			carousel.append($("<li id='"+idKey+key+window.lang+"' class='slick-slide'></li>").html(
				'<img src="'+val[icoProp]+'" onerror="$(this).remove()" alt="'+val.header+'" />'+
				'<div class="caption">'+val.header+'</div>'+
				'<a class="play out" href="'+val.link+'" target="_blank"></a>'
			));
		} else {
			carousel.append($("<li id='"+idKey+key+window.lang+"' class='slick-slide'></li>").html(
				'<img src="'+val[icoProp]+'" onerror="$(this).remove()" alt="'+val.header+'" />'+
				'<div class="caption">'+val.header+'</div>'+
				'<a class="play" href="'+val.link+'" target="_blank"></a>'
			));
		}
	});
	return carousel;
}


function getPinnedNews() {
	$('#main_news>.pinned>.item[data-news]').addClass('hidden').addClass('pointedOut');
	if(typeof window.lang === "string") {
		var cacheKey = 'pinnedNews_'+window.selectedBranch.name+'_'+window.lang,
			data = getContentCache(cacheKey);
		if(null === data) {
			siteRequest('news/'+window.lang+'/pinned', {}, function(response) { //GET game_edition
				var result = JSON.parse(response);
				if(result && result.data) {
					setContentCache(cacheKey, result.data, Date.now()+window.contentCacheInterval);
					renderPinnedNews(result.data);
				} else {
					console.log({
						"Request":'news/'+window.lang+'/pinned',
						"Response":response
					});
				}
			});
		} else {
			renderPinnedNews(data);
		}

		initPinnedWidgets();
	}
}

function renderPinnedNews(response) {
	var news = [];
	if(null !== response && response.length) {
		news = response;

		if(news[0]) {
			$('#main_news .pinned .item[data-news]')
				.removeClass('hidden')
				.attr('id', "news_item_"+news[0].id)
				.attr('data-news', news[0].id)
				.html(pinnedNewsTpl(news[0].ico, news[0].header, news[0].small_descr)).promise().done(function () {
				//Slide in pinned news
				window.setTimeout(function() {
					$('#main_news>.pinned>.item[data-news]').removeClass('pointedOut');
				}, 500);
			});
		}
	}
}

function pinnedNewsTpl(ico, header, small_descr) {
	var filename = ico.match(/[^\\/]+$/)[0],
		bgSize = '';
	if(filename === 'dummy.jpg') {
		bgSize = 'background-size:contain !important; background-color: #0a0809 !important;';
	}
	return '<div class="image" style="background: url('+ico+') no-repeat center center scroll; '+bgSize+'"></div>' +
	'<div class="caption">' +
	'<div class="title">'+header+'</div>' +
	'<div class="text">'+small_descr+'</div>' +
	'</div>';
}

function initPinnedWidgets() {
	$('#main_news .pinned .item[data-social-widget]').addClass('hidden').addClass('pointedOut');
	//load social widget
	if(window.lang==='ru' || window.geoInfo.country === 'RU') {
		//vkontakte
		$('#main_news .pinned .item[data-social-widget="vk"]').removeClass('hidden');
		loadVkApi();
	} else {
		//Twitter
		$('#main_news .pinned .item[data-social-widget="tw"]').removeClass('hidden');
		loadTwApi();
	}
}

function loadTwApi() {
	try {
		if(!$('#tw_api_transport').contents().length && !window.twApiTransportLoading) {
			window.twApiTransportLoading = true;
			setTimeout(function() {
				var el = document.createElement("script");
				el.type = "text/javascript";
				el.charset = "utf-8";
				el.src = "https://platform.twitter.com/widgets.js";
				el.async = true;
				document.getElementById("tw_api_transport").appendChild(el);
			}, 0);
			iframeLoaded('#tw_groups_pinned_r iframe', '.timeline-Header', function (e) {
				$("#tw_groups_pinned_r iframe").parent().parent().removeClass('pointedOut');
			});
		} else {
			$("#tw_groups_pinned_r iframe").parent().parent().removeClass('pointedOut');
		}
	} catch (e) {
		console.log(e);
	}
}

function loadVkApi() {
	try {
		if(!$('#vk_api_transport').contents().length && !window.vkApiTransportLoading) {
			window.vkApiTransportLoading = true;
			window.vkAsyncInit = initVkGroupWidget;
			setTimeout(function() {
				var el = document.createElement("script");
				el.type = "text/javascript";
				el.src = "https://vk.com/js/api/openapi.js?159";
				el.async = true;
				document.getElementById("vk_api_transport").appendChild(el);
			}, 0);
		} else {
			$("#vk_groups_pinned_r iframe").parent().parent().removeClass('pointedOut');
		}
	} catch (e) {
		console.log(e);
	}
}

function initVkGroupWidget() {
	try {
		VK.Widgets.Group("vk_groups_pinned_r", {mode: 4, width: "279", height: "267", color1: '16191a', color2: 'E7E5E5', color3: 'FFFFFF'}, 89771130);
		iframeLoaded("#vk_groups_pinned_r iframe", "#community_footer", vkWidgetListener);
	} catch (e) {
		console.log(e);
	}
}

function vkWidgetListener() {
	try {
		if(window.vkTimerRepeaterId !== null) {
			clearInterval(window.vkTimerRepeaterId);
			window.vkTimerRepeaterId = null;
		}
		window.vkTimerRepeaterId = setInterval(function() {
			$("#vk_groups_pinned_r iframe").height(267);
			if($("#vk_groups_pinned_r iframe").contents().find("#community_footer").length){
				$("#vk_groups_pinned_r iframe").contents().find("#community_footer").remove();
				$("#vk_groups_pinned_r iframe").contents().find("#page_wrap").css('border-radius', '0');
				$("#vk_groups_pinned_r iframe").contents().find("#main").css('height', '243px');
				$("#vk_groups_pinned_r iframe").contents().find("#community_content").removeClass('ui_scroll_hidden').css('height', '171px');
				$("#vk_groups_pinned_r iframe").contents().find("html head").append('<style> * { transition: none !important; } </style>');
				$("#vk_groups_pinned_r iframe").parent().parent().removeClass('pointedOut');
			}
		}, 3000);
	} catch (e) {
		console.log(e);
	}
}


function getImportantNews() {
	if(typeof window.lang === "string") {
		try {
			important_news.html('');
			enableBugreports();
			var cacheKey = 'supportNews_'+window.selectedBranch.name+'_'+window.lang,
				data = getContentCache(cacheKey);
			if(null === data) {
				siteRequest('support/news/'+window.lang, {}, function(result) {
					data = JSON.parse(result);
					if(window.environment !== 'Production') {
						console.log(data);
					}

					setContentCache(cacheKey, data, Date.now()+window.contentCacheInterval);
					$.each( data, function( key, val ) {
						renderImportantNews(val);
					});
				});
			} else {
				$.each( data, function( key, val ) {
					renderImportantNews(val);
				});
			}
		} catch (e) {
			console.log(e);
		}
	}
}

function renderImportantNews(val) {
	try {
		if(val.url.length) {
			important_news.html('<div class="item hidden" data-important-news="'+val.id+'"><a class="link" href="'+val.url+'"><i class="icon important"></i><span class="label" data-i18n="Important!"></span><span class="text"><span><span>'+val.message+'</span></span></span></a><div class="blurer"></div></div>');
		} else {
			important_news.html('<div class="item hidden" data-important-news="'+val.id+'"><div class="link"><i class="icon important"></i><span class="label" data-i18n="Important!"></span><span class="text"><span><span>'+val.message+'</span></span></span></div><div class="blurer"></div></div>');
		}
		if(typeof val.disableBugreports !== 'undefined' && val.disableBugreports === '1') {
			disableBugreports(val.message);
		}
		reCalculateImportantNews();
	} catch (e) {
		console.log(e);
	}
}

function reCalculateImportantNews() {
	whenJqueryFuncAvailable('localize',  function() {
		$('#important_news').localize();
		Blur("#important_news .item .blurer");
		important_news.find('.item').css({"opacity":0}).removeClass('hidden');
		var label_width = important_news.find('.item .label').width(),
			icon_width = important_news.find('.item .icon').width(),
			new_padding = label_width + icon_width + 30,
			padding_right = 2;

		if(important_news.find('.item a').length){
			padding_right = 30;
		}

		important_news.find('.item .text').css({"padding-left": new_padding+"px", "padding-right": padding_right+"px"});
		important_news.find('.item').stop( true, true ).animate({"opacity":1},'fast');
		calculateImportantResponsive();
		$(window).trigger('resize');
	});
}

function enableBugreports() {
	window.bugReportDisabledMessage = null;
}
function disableBugreports(message) {
	window.bugReportDisabledMessage = message;
}

function changeContentLang(lang) {
	try {
		clearNewsPage();
	} catch(e) {
		console.log(e);
	}

	try {
		initCarousels(lang);
	} catch(e) {
		console.log(e);
	}

	try {
		if($('#main_content').length) {
			getImportantNews();
			getPinnedNews();
			if(window.current_page) {
				renderPage(window.current_page.split('_').shift());
			}
		}
	} catch(e) {
		console.log(e);
	}
}

function clearNewsPage() {
	$('#news_list .carousel').html('');
	$('#news_list .list').html('');
	window.news_carousel = null;
	window.news_list = null;
	window.appending = false;
	window.append_page = 1;
}

function initNewsPage(lang) {
	try {
		//video carousel
		if(null == window.news_carousel) {
			initCarousels(lang);
		}

		//news list
		if(null == window.news_list) {
			whenAvailable('game_edition', function () {
				appendNewsPage();
			});
		}
	} catch(e) {
		console.log(e);
	}
}

function appendNewsPage() {
	try {
		if(!window.appending) {
			window.appending = true;
			var cacheKey = 'pageNews_'+window.selectedBranch.name+'_'+window.lang+'_page'+window.append_page,
				data = getContentCache(cacheKey);
			if(null === data) {
				siteRequest('news/'+window.lang+'/page/'+window.append_page, {}, onAppendSuccess, onAppendError);
			} else {
				onAppendSuccess(data);
			}
		}
	} catch(e) {
		console.log(e);
	}
}

function onAppendSuccess(result) {
	try {
		if(IsJsonString(result)) {
			result = JSON.parse(result);
		}
		var cacheKey = 'pageNews_'+window.selectedBranch.name+'_'+window.lang+'_page'+window.append_page;
		setContentCache(cacheKey, result, Date.now()+window.contentCacheInterval);
		if(null !== result) {
			news_total = result.count;
			window.news_list = $('#news_list .list');
			$.each( result.data, function( key, val ) {
				window.news_list.append('<div id="news_list_item_'+val.id+'" class="item">' +
					'<div class="image" data-news="'+val.id+'"><img src="'+val.ico+'" onerror="brokenImage(this)" alt="'+val.header+'" /></div>' +
					'<div class="info">' +
					'<div class="date"><div class="value inline">'+moment.unix(val.date).format('DD MMMM YYYY')+'</div><div class="before inline">'+moment.unix(val.date, 'DD MMMM YYYY').fromNow()+'</div></div> '+
					'<div class="headline" data-news="'+val.id+'"><span>'+val.header+'</span><i class="icon link"></i></div>'+
					'<div class="small_descr">'+val.small_descr+'</div>'+
					'<div class="social"><div class="likes" onclick="newsLike('+val.id+')"><i class="icon like"></i><span class="value">'+val.likes+'</span></div></div>'+
					'</div>' +
					'</div>');
			});
			window.append_page++;
		}
	} catch (e) {
		console.log(e);
	}
	window.appending = false;
}

function onAppendError(errorCode) {
	try {
		if (window.environment !== "Production") {
			console.log(errorCode);
		}
	} catch (e) {
		console.log(e);
	}
	window.appending = false;
}

function scrollAppending() {
	if($('#news_content').height() + $('#news_content').scrollTop() >= parseInt($('#news_content .container').height()) && !appending) {
		if(news_total > $("#news_content #news_list .item").length) {
			appendNewsPage();
		}
	}
}

function renderNewsItem(id, header, ico, descr, small_descr, datecreated, likes) {
	var url = window.site_url+'/news/id/'+id;
	$('#news_content').addClass('hidden');
	$('#news_item').removeClass('hidden');
	whenJqueryFuncAvailable('localize',  function() {
		let cachedLikes = newsReadLike(id);
		if(null !== cachedLikes) {
			likes = cachedLikes;
		}
		$('#news_item').attr('data-id', id).html('<div class="container small">' +
				'<div class="breadcrumbs"><div class="back_button" onclick="renderPage(\'news\');"><i class="icon back"></i><span data-i18n="Back">'+i18next.t("Back")+'</span></div></div>' +
				'<div class="headline"></div>' +
				'<div class="info">' +
					'<div class="likes inline" onclick="newsLike('+id+')">' +
						'<i class="icon like"></i>' +
						'<span class="value">0</span>' +
					'</div>' +
				'</div>' +
				'<div class="image newsItem"><img src="'+ico+'" alt="'+header+'" onerror="brokenImage(this)" /></div>' +
				'<div class="content"></div>' +
				'<div class="links">' +
					'<div class="left">' +
						'<div class="back_button" onclick="renderPage(\'news\');"><i class="icon back"></i><span data-i18n="Back">'+i18next.t("Back")+'</span></div>' +
					'</div>' +
					'<div class="right">' +
						'<a href="'+url+'"><span data-i18n="Watch on website">'+i18next.t("Watch on website")+'</span><i class="icon next"></i></a>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="splitter"></div>' +
			'<div class="container small">' +
                '<div class="sharing">'+
                    '<div class="left">' +
                        '<div class="comments"></div>' +
                        '<div class="likes" onclick="newsLike('+id+')">' +
                            '<i class="icon like"></i>' +
                            '<span class="value">'+likes+'</span>' +
                            '<span data-i18n="Liked"></span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="right">' +
                        '<div class="sharer"><i class="icon share"></i><span data-i18n="Share">'+i18next.t("Share")+'</span><ul class="hidden"></ul></div>' +
                    '</div>' +
                '</div>' +
            '</div>')
				.promise().then(function (e) {
					$('#news_item .headline').html(header);
					$('#news_item>.container>.content').html(descr);
					$('#news_item .likes .value').html(likes);
					if(datecreated>0) {
						$('#news_item .info').prepend('<div class="date inline">' +
								'<div class="value inline">'+moment.unix(datecreated).format('DD MMMM YYYY')+'</div>' +
								'<div class="before inline">'+moment.unix(datecreated, 'DD MMMM YYYY').fromNow()+'</div>' +
							'</div>');
					}
					let share_list = getShareList(url, header, ico, small_descr);
					$('#news_item .sharer ul').html(share_list);
                    $('#news_item').localize();

					$('#news_item>.container>.sharing>.right>.sharer').click(function(e){
						var list = $('#news_item>.container>.sharing>.right>.sharer>ul');
						if(list.hasClass('hidden')) {
							list.hide().removeClass('hidden').fadeIn('fast');
						} else {
							list.fadeOut('fast', function(e) {
								list.addClass('hidden');
							});
						}
					});
				});
	});
}

function showNews(id) {
	try {
		$('#news_item').addClass('hidden');
		GoToPage('/page/news/'+id);
		current_page = 'news_item';
		renderPage("news");
		current_page = 'news_item';
		var cacheKey = 'newsViewById_'+id+'_'+lang+'_'+window.selectedBranch.name,
			val = getContentCache(cacheKey);
		if(null === val) {
			siteRequest('news/'+lang+'/id/'+id, {}, function(val) {
				val = JSON.parse(val);
				if(typeof val === 'object') {
					setContentCache(cacheKey, val, Date.now()+window.contentCacheInterval);
					renderNewsItem(id, val.header, val.ico, val.descr, val.small_descr, val.date, val.likes);
				}
			});
		} else {
			renderNewsItem(id, val.header, val.ico, val.descr, val.small_descr, val.date, val.likes);
		}
	} catch(e) {
		console.log(e);
	}
}


function drawUserData() {
	try {
		renderUserData({
			'login': settings.nickname ?? '',
			'avatar': settings.userAvatar ?? '',
			'gameEdition': settings.gameEdition ?? '',
			'gameRegion': settings.userRegion ?? '',
			'etstesterstatus': ets_tester_status ?? getBranch('ets').participationStatus ?? 0,
			'channels': settings.sitePushStreamChannels ?? [],
			'bubble': settings.supportUnreadNotifications ?? 0,
		});
	} catch(e) {
		console.log(e);
	}
}

function renderUserData(userData) {
	$.each( userData, function( key, val ) {
		if(key=='avatar') {
			$('#head .user .avatar img').attr('src', val).attr('onerror', 'brokenImage(this)');
		}
		if(key=='login') {
			$('#head .user .username').text(val);
		}
		if(key=='channels') {
			initPushing(val);
		}
		if(key=='gameEdition' && val !== window.game_edition) {
			editionChanged = true;
			window.game_edition = val;
		}
		if(key=='gameRegion' && val !== window.game_region) {
			regionChanged = true;
			window.game_region = val;
		}
		if(key=='etstesterstatus') {
			setUserETSStatus(val);
		}
		if(key=='bubble') {
			refreshSupportBubble(val);
		}
	});
	whenJqueryFuncAvailable('localize',  function() {
		$('#head .user').localize();
	});
}

function newsLike(id) {
	var cacheKey = 'newsLike_'+id+'_'+window.selectedBranch.name,
		data = getContentCache(cacheKey);
	if(null === data) {
		GoToPage('/like/news/'+id);
		siteRequest('news/like/'+id+'/'+window.settings.aid, {}, function(data) {
			data = JSON.parse(data);
			if(typeof data === 'object') {
				setContentCache(cacheKey, data, Date.now()+window.contentCacheInterval);
				$('[onclick="newsLike('+id+')"]').find('.value').text(data.total);
				setNewsLikeValueEverywhere(id, data.total);
			}
		});
	} else {
		$('[onclick="newsLike('+id+')"]').find('.value').text(data.total);
	}
}

function newsReadLike(id) {
	var cacheKey = 'newsLike_'+id+'_'+window.selectedBranch.name,
		data = getContentCache(cacheKey);
	if(data && data.total) {
		return data.total;
	}
	return null;
}

function setNewsLikeValueEverywhere(id, newValue) {
	var cacheKeyView = 'newsViewById_'+id+'_'+window.selectedBranch.name,
		cacheKeyLike = 'newsLike_'+id+'_'+window.selectedBranch.name;

	for (let cacheKeyFor in window.contentCache) {
		let val = window.contentCache[cacheKeyFor].data;
		if(cacheKeyFor === cacheKeyView && val && val.likes) {
			window.contentCache[cacheKeyFor].data.likes = newValue;
		}
		if(cacheKeyFor === cacheKeyLike && val && val.total) {
			window.contentCache[cacheKeyFor].data.total = newValue;
		}
		if(cacheKeyFor.startsWith('pageNews_'+window.selectedBranch.name)) {
			let index = window.contentCache[cacheKeyFor].data.data.findIndex(row => row.id == id);
			if(index !== -1) {
				window.contentCache[cacheKeyFor].data.data[index].likes = newValue;
			}
		}
	}
}
/*EOF FRONTEND FUNCTIONS*/




/*YOUTUBE API*/
function pauseAllVideos() {
	try {
		$('iframe').each(function(){
			this.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*')
		});
	} catch(e) {
		console.log(e);
	}
}

function initVideoHandler() {
	var YT_api_url = "https://www.youtube.com/iframe_api";
	if(!isScriptLoaded(YT_api_url)) {
		var tag, firstScriptTag;
			tag = document.createElement('script');
		tag.src = YT_api_url;
		tag.async = "";
		firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	}
}


////создание плейера для каждого видео
function onYouTubeIframeAPIReady() {
	YT_ready = true;
}

////в зависимости от состояния плейера
////показываем и скрываем главное меню
function onPlayerStateChange(event) {
	try {
		switch(event.data) {
			case YT.PlayerState.ENDED: try{ document.webkitExitFullscreen(); $( event.target.getIframe() ).addClass('hidden'); news_carousel.slick('slickPlay'); main_carousel.slick('slickPlay'); } catch(e){console.log(e);} break;
			case YT.PlayerState.PLAYING: try{ $( event.target.getIframe() ).removeClass('hidden'); news_carousel.slick('slickPause'); main_carousel.slick('slickPause'); } catch(e){console.log(e);} break;
			case YT.PlayerState.PAUSED: break;
			case YT.PlayerState.BUFFERING: break;
			case YT.PlayerState.CUED: break;
			default:  break;
		}
	} catch(e) {
		console.log(e);
	}
}

function onPlayerReady(event) {
	event.target.playVideo();
}

function playVideo(div_id) {
	try {
		if(YT_ready) {
			if(video_players[div_id]) {
				if(typeof video_players[div_id].playVideo == 'function')
				{
					video_players[div_id].playVideo();
				} else {
					console.log("video_players["+div_id+"].playVideo - not ready");
				}
			} else {
				createIframe(div_id);
			}
		}
	} catch(e) {
		createIframe(div_id);
		console.log(e);
	}
}

function createIframe(div_id) {
	try {
		var play_button = '#' + div_id + ' .play',
			videoId = $(play_button).attr('data-video');
		if(!$(div_id + ' iframe').length) {
			$('<div />', {
				id: "YT_"+div_id,
				class: "hidden",
				allowscriptaccess: "always"
			}).appendTo('#'+div_id);
			video_players[div_id] = new YT.Player("YT_" + div_id, {
				width: '478',
				height: '269',
				videoId: videoId,
				playerVars: {
					modestbranding: 0,
					rel: 0,
					showinfo: 0
				},
				events: {
					'onReady': onPlayerReady,
					'onStateChange': onPlayerStateChange
				}
			});
		}
	} catch(e) {
		console.log(e);
	}
}
/*EOF YOUTUBE API*/

function refreshSiteConfig() {
	try {
		if(!window.siteConfig) {
			siteRequest('site/config', {}, function(data) {
				if(window.environment !== "Production") {
					console.log(data);
				}
				data = JSON.parse(data);
				window.siteConfig = data;
				renderSiteConfig();
			});
		} else {
			renderSiteConfig();
		}

	} catch(e) {
		console.log(e);
	}
}
function renderSiteConfig() {
	window.main_menu_links = [];
	if(typeof window.siteConfig.headerLinks !== 'undefined') {
		$.each(window.siteConfig.headerLinks, function (k, v) {
			if(typeof v !== 'undefined') {
				window.main_menu_links[k] = v;
			}
		});
	}
	initSiteLinks();
	refreshETSMenuBlinking(window.ets_tester_status);
}

function refreshSupportBubble(count) {
	if(0<parseInt(count)) {
		if(9<count) {
			count = 9;
		}
		if($('#head .menu .support>.bubble').length) {
			$('#head .menu .support>.bubble>span').text(count);
		} else {
			$('#head .menu .support').append('<a href="'+window.site_url+"/support/request"+'" class="bubble" style="display:none;"><span>'+count+'</span></a>');
			$('#head .menu .support .bubble').fadeIn('fast');
		}
	} else {
		$('#head .menu .support .bubble').fadeOut('fast', function (e) {
			$(this).remove();
		});
	}
}


//mainmenu Header collapser
function headerCollapse() {
	var headMenu = $('#head>.wrap>.menu'),
		headerWidth = parseInt(headMenu.width()),
		overflowed;

	if(typeof headMenu !== "undefined") {
		if(null === main_menu_collapse_width) {
			reinitCollapser();
		}
		overflowed = headerWidth<main_menu_collapse_width;

		if(overflowed) {
			headMenu.addClass('collapsed');
		} else {
			headMenu.removeClass('collapsed');
		}

	}
	// console.log(
	// 	'overflowed:' + overflowed +
	// 	' main_menu_collapse_width:'+main_menu_collapse_width +
	// 	' headerWidth:'+headerWidth
	// );
}

function reinitCollapser() {
	var headMenu = $('#head>.wrap>.menu');
	if(typeof headMenu !== "undefined" && typeof head_user_block.offset() !== "undefined") {
		headMenu.css('opacity', 0);
		headMenu.removeClass('collapsed');
		var headerWidth = parseInt(headMenu.width()),
			menuWidth = parseInt(
				head_user_block.offset().left + head_user_block.outerWidth(true) - parseInt(head_user_block.css('margin-left'))
			)-2;
		if(headerWidth<menuWidth) {
			main_menu_collapse_width = menuWidth;
		}
		// console.log(
		// 	'headerWidth:' + headerWidth +
		// 	' menuWidth:'+menuWidth +
		// 	' menu formula:'+ head_user_block.offset().left + " + " + head_user_block.outerWidth(true) + " - " + parseInt(head_user_block.css('margin-left'))
		// );
		headMenu.css('opacity', 1);
	}
}

function calculateImportantResponsive() {
	var text = $('#important_news .item .text'),
		text_span = text.find('span span'),
		cont_width = text.width(),
		text_width = text_span.textWidth();


	if (cont_width < text_width) {
		//calc marquee speed
		var calc_text_width = text_span.width() + parseInt(text_span.css('padding-left')),
			animationTime = calcImportantNewsMarqueeSpeedTime(calc_text_width, cont_width);
		text_span.css('animation', 'marquee '+animationTime+'s linear infinite');
		$('#important_news .item .text').addClass('marquee');
	} else {
		$('#important_news .item .text').removeClass('marquee');
	}
}

function calcImportantNewsMarqueeSpeedTime(textWidth, contWidth) {
	var s = textWidth-contWidth,
		time = s / window.important_news_marquee_speed;
	return time;
}

/*SOCIAL SHARER*/
function getShareList(url, title, img, text) {
	let list = '';
	if(window.geoInfo.country !== 'RU') {
		list += '<li><a href="'+Share.facebook(url, title, img, text)+'" data-i18n="FB"></a></li>';
	}
	list += '<li><a href="'+Share.twitter(url, title)+'" data-i18n="TW"></a></li>';
	list += '<li><a href="'+Share.vkontakte(url, title, img, text)+'" data-i18n="VK"></a></li>';
	list += '<li><a href="'+Share.odnoklassniki(url, title, img, text)+'" data-i18n="OK"></a></li>';
	list += '<li><a href="'+Share.mailru(url, title, img, text)+'" data-i18n="MR"></a></li>';
	return list;
}


Share = {
	vkontakte: function(purl, ptitle, pimg, text) {
		url  = 'https://vkontakte.ru/share.php?';
		url += 'url='          + encodeURIComponent(purl);
		url += '&title='       + encodeURIComponent(ptitle);
		url += '&description=' + encodeURIComponent(text);
		url += '&image='       + encodeURIComponent(pimg);
		url += '&noparse=true';
		return url;
	},
	odnoklassniki: function(purl, ptitle, pimg, text) {
		url  = 'https://connect.ok.ru/offer?';
		url += 'url='           + encodeURIComponent(purl);
		url += '&title='        + encodeURIComponent(ptitle);
		url += '&description='  + encodeURIComponent(text);
		url += '&imageUrl='     + encodeURIComponent(pimg);
		return url;
	},
	facebook: function(purl, ptitle, pimg, text) {
		url  = 'https://www.facebook.com/sharer.php?s=100';
		url += '&p[title]='     + encodeURIComponent(ptitle);
		url += '&p[summary]='   + encodeURIComponent(text);
		url += '&p[url]='       + encodeURIComponent(purl);
		url += '&p[images][0]=' + encodeURIComponent(pimg);
		return url;
	},
	twitter: function(purl, ptitle) {
		url  = 'https://twitter.com/share?';
		url += 'text='      + encodeURIComponent(ptitle);
		url += '&url='      + encodeURIComponent(purl);
		url += '&counturl=' + encodeURIComponent(purl);
		return url;
	},
	mailru: function(purl, ptitle, pimg, text) {
		url  = 'https://connect.mail.ru/share?';
		url += 'url='          + encodeURIComponent(purl);
		url += '&title='       + encodeURIComponent(ptitle);
		url += '&description=' + encodeURIComponent(text);
		url += '&imageurl='    + encodeURIComponent(pimg);
		return url;
	}
};
/*EOF SOCIAL SHARER*/







function initPushing(channels) {
	try {
		if(channels.length) {
			if(window.environment !== 'Production') {
				console.log(channels);
				PushStream.LOG_LEVEL = 'debug';
			}

			channels.forEach(function(channel) {
				var searchIndex = window.pushstreams.findIndex(x => x.host === channel.host);
				if(searchIndex < 0) {
					addPushStreamServer(channel);
				} else {
					window.pushstreams[searchIndex].addChannel(channel.channel_id);
				}
			});

			window.pushstreams.forEach(function(server) {
				server.connect();
			});

		}
	} catch(e) {
		console.log(e);
	}
}

function addPushStreamServer(channel) {
	let ServerConf = window.pushstreamConfig;
	ServerConf.host = channel.host;
	ServerConf.urlPrefixWebsocket = channel.urlPrefix;
	let	Server = new PushStream(ServerConf);
	Server.onmessage = pushReceived;
	Server.addChannel(channel.channel_id);
	window.pushstreams.push(Server);
}

function pushReceived(data, id, channel) {
	if($('body').hasClass('powersaving')) {
		window.pushstreamBuffer.push({
			data: data,
			id: id,
			channel: channel,
		});
	} else {
		if(typeof data.type !== 'undefined') {
			try {
				switch (data.type) {
					case "content":
						if(typeof data.payload.contentCache !== 'undefined') {
							for (let [cacheKey, cacheData] of Object.entries(data.payload.contentCache)) {
								setContentCache(cacheKey, cacheData.data, cacheData.valid);
							}
						}
						if(typeof data.payload.siteConfig !== 'undefined') {
							window.siteConfig = data.payload.siteConfig;
							renderSiteConfig();
						}
						console.log('Updated SiteConfig. Updated Cache. RedrawingLanguage...');
						if(data.payload.branchName === window.selectedBranch.name) {
							redrawLanguage(window.lang);
						}
						break;
					//case "game":
					//	console.log('Updating launcher and game');
					//	launcher.checkForUpdate();
					//	break;
					case "user":
						console.log('User info refreshed');
						renderUserData(data.payload);
						break;
					//case "legal":
					//	console.log('Legal push cathced');
					//	launcher.showLicenseAgreement();
					//	break;
					case "logout":
						console.log('logout');
						launcher.logout();
						break;
					default:
						//do nothing
						break;
				}
			} catch (e) {console.log(e);}
		}
	}
}

function processPushBuffer() {
	for (var i = 0; i < pushstreamBuffer.length; i++) {
		var task = pushstreamBuffer.shift();
		pushReceived(task.data, task.id, task.channel);
	}
	window.pushstreamBuffer = [];
}

function setCurrentGameServers (servers) {
	if(game_main.length) {
		whenJqueryFuncAvailable('localize',  function() {
			var value,
				selectedServers = servers.filter(function(server){
					return server.isSelected;
				});

			if (!selectedServers.length) {
				value = '<span data-i18n="Auto">'+i18next.t("Auto") + "</span> " + window.settings.ipRegion;
			} else {
				value = selectedServers.map(function(elem){
					return elem.name;
				}).join(', ');
			}

			game_main.find('.config-matching .value').html(value);
			game_main.find('.config-matching').attr('data-tooltip', value).attr('data-tooltip-side', 'top-center').attr('data-tooltip-i18n', false);
			initTooltip();
			onResizeGameServers();
		});
	}
}

function onResizeGameServers() {
	if(game_main.length>0) {
		game_main.find('.config-matching .value_wrap').stop( true, true );

		if(game_main.find('.config-matching .value').text().length) {
			game_main.find('.config-matching .value_wrap').removeClass('hidden');
		} else {
			game_main.find('.config-matching .value_wrap').addClass('hidden');
		}

		game_main.find('.config-matching').attr('data-tooltip-hidden', true);
	}
}

function onBranchChange(branch) {
	let branchIsChanged = false;
	if(!window.selectedBranch) {
		window.selectedBranch = branch;
		branchIsChanged = true;
	} else if(JSON.stringify(window.selectedBranch) !== JSON.stringify(branch)) {
		window.selectedBranch = branch;
		branchIsChanged = true;
	} else {
		return false;
	}

	if(branch.feedbackBehavior > 0) {
		$('[onclick*="showFeedback"]').each(function (i, v) {
			$(v).removeClass('hidden');
			if(window.environment !== 'Production') {
				console.log({'hidden removed':v});
			}
		});
	} else {
		$('[onclick*="showFeedback"]').each(function (i, v) {
			$(v).addClass('hidden');
			if(window.environment !== 'Production') {
				console.log({'hidden added':v});
			}
		});
	}

	$('body').attr('data-branch', branch.name);
	$('body [data-branch]').each(function () {
		if($(this).attr('data-branch') == 'default') {
			$(this).removeClass('hidden');
		} else {
			$(this).addClass('hidden');
		}
	});
	try {
		window.settings.branches.forEach(function (branch) {
			$('[data-main-button]').removeClass(branch.name);
		});
	} catch (e){}
	if(branch.name === "ets" || branch.name === "tournament") {
		$('body [data-branch]').each(function () {
			if($(this).attr('data-branch') == branch.name) {
				$(this).removeClass('hidden');
			} else {
				$(this).addClass('hidden');
			}
		});
		$('[data-main-button]').addClass(branch.name);
	}
	renderBackground(window.current_page);
	renderGameDir(window.selectedBranch.gameDirectory);
	if(branchIsChanged) {
		redrawLanguage(window.lang);
	}
}

function renderBranchList(options) {
	let branchesListSelector = '[data-name="selectedBranchName"]';
	whenAvailable("i18next", function() {
		if($(branchesListSelector).length) {
			$(branchesListSelector).html('');

			if(options.length<2) {
				$('#selectedBranch').addClass('locked');
			}

			$.each(options, function (i, branch) {
				var selected = '',
					disabled = '',
					customLabel = '',
					label = jsUcfirst(branch.name);

				try {
					customLabel = i18next.t('BranchCustomLabel_'+branch.name);
					if(customLabel.length>0 && 'BranchCustomLabel_'+branch.name !== customLabel) {
						label = customLabel;
					}
				} catch (e) {
					console.log({'BranchCustomLabel not found for': branch.name, "searched for": 'BranchCustomLabel_'+branch.name, 'Result':i18next.t('BranchCustomLabel_'+branch.name)});
				}

				if(branch.isSelected === true) {
					selected = 'selected="selected"';
					$('#selectedBranch').html(label).attr('data-value', branch.name);
				}
				if(branch.participationStatus === 3) {
					disabled = 'disabled="disabled"';
				}
				$(branchesListSelector).append('<li data-value="'+branch.name+'" '+selected+' '+disabled+'>'+label+'</li>');
			});
			$('#selectedBranch').on('click', function (e) {
				e.stopImmediatePropagation();
				if(!$('#selectedBranch').hasClass('locked')) {
					if($('#selectedBranch').hasClass('opened')) {
						$('#selectedBranchName').fadeOut('fast').removeClass('visible');
						$('#selectedBranch').removeClass('opened');
					} else {
						$('#selectedBranchName').fadeIn('fast').addClass('visible');
						$('#selectedBranch').addClass('opened');
					}
				}
			});
			$('#selectedBranchName li').on('click', function (e) {
				e.stopImmediatePropagation();
				if(!$('#selectedBranch').hasClass('locked') && !$(this).attr('disabled')) {
					selectBranch($(this).attr('data-value'));
					$('#selectedBranchName').fadeOut('fast').removeClass('visible');
					$('#selectedBranch').removeClass('opened');
				}
			});
		}
	});
}

function refreshBranchSelectorState() {
	//Список кейсов для разблокировки селектора
	if($('#selectedBranchName').length) {
		if(
			(window.selectBranchGameUpdateStates.indexOf(window.condition.gameUpdateState) !== -1) &&
			(window.selectBranchGameStates.indexOf(window.condition.gameState) !== -1)
		) {
			$("#selectedBranchName").prop('disabled', false);
		} else {
			$("#selectedBranchName").prop('disabled', true);
		}
	}

	var items = [
		'[onclick*="showFeedback"]'
	];
	if((window.sendFeedbackGameUpdateStates.indexOf(window.condition.gameUpdateState) !== -1) && (window.sendFeedbackGameStates.indexOf(window.condition.gameState) !== -1)) {
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

function initRangeInput($input, val) {
	if (typeof ionRangeSlider === 'function') {

	}
}
