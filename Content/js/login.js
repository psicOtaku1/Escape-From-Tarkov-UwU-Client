var savedLogin = '',
	loginChanged = false,
	submitButton = $('button[type="submit"]');

$(".eye").bind("mousedown touchstart", function (e) {
	//open pass
	e.stopPropagation();
	$(this).removeClass('eye-closed').addClass('eye-opened');
	$('#password').attr('type', 'text');
}).bind("mouseup mouseleave touchend", function (e) {
	//close pass
	e.stopPropagation();
	$(this).removeClass('eye-opened').addClass('eye-closed');
	$('#password').attr('type', 'password');
});

function initLoginPage(saveLogin, savePassword, email) {
	var seconds = 0;
	GoToPage('/page/login');

	if (saveLogin) {
		if (email) {
			window.savedLogin = email;
			$('#email').val(maskEmail(email, '*'));
		}
	}
	if (savePassword) {
		$('#password').val("********");
	}

	$('#email').on('focus', function (e) {
		if (!window.loginChanged) {
			window.loginChanged = true;
			$('#email').val("");
		}
	});

	$('#LauncherLogin').on('submit', function (e) {
		e.stopPropagation();
		e.preventDefault();

		var emailVal = $('#email').val();

		if (!window.loginChanged) {
			emailVal = window.savedLogin;
		}

		if (!$(submitButton).hasClass('disabled')) {
			unsetLoginError();
			hideCaptcha();
			showLoginLoader();

			if (!$('.fields>.login').hasClass('hidden')) {
				launcherLogin(emailVal, $('#password').val(), $("#g-recaptcha-response").val());
			} else if (!$('.fields>.secondfactor').hasClass('hidden')) {
				launcherActivateDevice(emailVal, $('#password').val(), $('#deviceid').val());
			} else if (!$('.fields>.smsFormPhone').hasClass('hidden')) {
				launcherVerifyPhone(emailVal, $('#phoneNumber').val(), function (response) {
					try {
						response = JSON.parse(response);
						console.log(response);
						hideLoginLoader();
						if (response && response.result && response.result.expire) {
							showSmsValidationCode(response.result.expire);
							resizeWindow(null, null);
						}
					} catch (e) {
						console.log(e);
					}
				});
			} else if (!$('.fields>.smsFormCode').hasClass('hidden')) {
				launcherVerifyCode(emailVal, $('#password').val(), $('#phoneCode').val(), function (response) {
					try {
						response = JSON.parse(response);
						console.log(response);
						hideLoginLoader();
						resizeWindow(null, null);
					} catch (e) {
						console.log(e);
					}
				});
			}
		} else {
			console.log('Button is disabled for now.');
		}
		lockLoginButton();
	});
	$('#LauncherLogin .back_button').on('click', function (e) {
		e.preventDefault();
		hideActivationCodeForm();
		hideSmsValidation();
	});
}

function lockLoginButton() {
	submitButton.addClass('disabled');
}

function unlockLoginButton(delay) {
	var seconds = delay || 0;
	if (seconds > 0) {
		$('#loginButtonText').fadeOut(function (e) {
			$('#loginButtonCountdown').html(renderSeconds(seconds)).fadeIn();
		});

		new Countdown({
			seconds: seconds,  // number of seconds to count down
			onUpdateStatus: function (sec) {
				$('#loginButtonText').fadeOut(function (e) {
					$('#loginButtonCountdown').html(renderSeconds(sec));
				});
				$('[data-countdown]').html(renderSeconds(sec));
			}, // callback for each second
			onCounterEnd: function () {
				clearInterval(window.loginCountdown);
				submitButton.removeClass('disabled');
				$('#loginButtonCountdown').fadeOut(function (e) {
					$('#loginButtonText').fadeIn();
				});
			} // final action
		}).start();
	} else {
		submitButton.removeClass('disabled');
	}
}



/**
 * SMS validation js
 */
function displayActivationCodeForm() {
	var loginForm = $('#LauncherLogin');
	hideLoginLoader();
	unlockLoginButton(0);
	loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
		loginForm.find('.fields>.login').addClass('hidden');
		loginForm.find('.fields>.smsFormPhone').addClass('hidden');
		loginForm.find('.fields>.smsFormCode').addClass('hidden');
		loginForm.find('.fields>.secondfactor').removeClass('hidden');
		// font changing code here
		loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
			resizeWindow(null, null);
		});
	});
}

function hideActivationCodeForm() {
	var loginForm = $('#LauncherLogin');
	if (loginForm.length) {
		loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
			loginForm.find('.fields>.login').removeClass('hidden');
			loginForm.find('.fields>.smsFormPhone').addClass('hidden');
			loginForm.find('.fields>.smsFormCode').addClass('hidden');
			loginForm.find('.fields>.secondfactor').addClass('hidden');
			$('#deviceid').val('');
			unlockLoginButton(0);
			resizeWindow(null, null);
			// font changing code here
			loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
				resizeWindow(null, null);
			});
		});
	}
}
/**
 * EOF SMS validation js
 */


/**
 * Phone validation js
 ***/
function showSmsValidationPhone(geoInfo) {
	setGeoInfo(geoInfo);
	var loginForm = $('#LauncherLogin');
	hideLoginLoader();
	unlockLoginButton(0);
	loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
		loginForm.find('.fields>.login').addClass('hidden');
		loginForm.find('.fields>.secondfactor').addClass('hidden');
		loginForm.find('.fields>.smsFormCode').addClass('hidden');
		loginForm.find('.fields>.smsFormPhone').removeClass('hidden');
		// font changing code here
		loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
			resizeWindow(null, null);
			$("#phoneNumber").bind("keyup", function () {
				validatePhone();
			});
			validatePhone();
			setFormatPhone(formatPhone());
		});
	});
}

function showSmsValidationCode(codeExpire) {
	var loginForm = $('#LauncherLogin'),
		expire = codeExpire || null;
	hideLoginLoader();
	unlockLoginButton(0);
	loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
		loginForm.find('.fields>.login').addClass('hidden');
		loginForm.find('.fields>.secondfactor').addClass('hidden');
		loginForm.find('.fields>.smsFormPhone').addClass('hidden');
		loginForm.find('.fields>.smsFormCode').removeClass('hidden');
		// font changing code here
		if (expire) {
			initCodeExpire(expire);
		}

		loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
			resizeWindow(null, null);
			$("#phoneCode").bind("keyup", function () {
				validateCode();
			});
			validateCode();
		});
	});
}

function hideSmsValidation() {
	var loginForm = $('#LauncherLogin');
	if (loginForm.length) {
		loginForm.find('.fields').animate({opacity: '0'}, 200, function () {
			loginForm.find('.fields>.login').removeClass('hidden');
			loginForm.find('.fields>.secondfactor').addClass('hidden');
			loginForm.find('.fields>.smsFormPhone').addClass('hidden');
			loginForm.find('.fields>.smsFormCode').addClass('hidden');
			$('#phoneNumber').val('').unbind("keyup");
			$('#phoneCode').val('');
			unlockLoginButton(0);
			resizeWindow(null, null);
			// font changing code here
			loginForm.find('.fields').animate({opacity: '100'}, 200, function () {
				resizeWindow(null, null);
			});
		});
	}
}

function formatPhone() {
	try {
		let country = (geoInfo && geoInfo.country) ? geoInfo.country : null,
			libPhone = new libphonenumber.AsYouType(country),
			val_old = $("#phoneNumber").val(),
			phoneNumber = new libphonenumber.parsePhoneNumber(val_old, country);

		return libPhone.input(phoneNumber.number);
	} catch (e) {
	}
}

function setFormatPhone(newString) {
	$("#phoneNumber").focus().val("").val(newString);
}

function validatePhone() {
	try {
		let country = (geoInfo && geoInfo.country) ? geoInfo.country : null,
			val_old = $("#phoneNumber").val(),
			phone = formatPhone();

		if (val_old.length < 5 || phone.length === 0) {
			lockLoginButton();
			$("[data-phone-number-result]").text("");
			$("[data-phone-number-result]").parent().addClass('hidden');
		} else {
			$("[data-phone-number-result]").text(phone);
			$("[data-phone-number-result]").parent().removeClass('hidden');
		}

		let phoneNumber = new libphonenumber.parsePhoneNumber(val_old, country)

		if (phoneNumber.isValid()) {
			unlockLoginButton();
		} else {
			lockLoginButton();
		}
	} catch (e) {
	}
}

function validateCode() {
	try {
		let valid = false,
			val = $("#phoneCode").val();

		if (val.length === 4 || val.length === 6) {
			valid = true;
		}
		if (valid) {
			unlockLoginButton();
		} else {
			lockLoginButton();
		}
	} catch (e) {
	}
}

function initCodeExpire(codeExpire) {
	var message = i18next.t("Code expires in ", {args: [parseInt(codeExpire)]}),
		$html = $('<div />', {html: message});
	$html.find('[data-countdown]').html(renderSeconds(parseInt(codeExpire)));
	message = $html.html();
	$('[data-code-expire]').html(message).removeClass('hidden');
	new Countdown({
		seconds: parseInt(codeExpire) - 1,  // number of seconds to count down
		onUpdateStatus: function (sec) {
			$('[data-countdown]').html(renderSeconds(sec));
		}, // callback for each second
		onCounterEnd: function () {
			$('[data-code-expire]').fadeOut('fast');
			clearInterval(window.loginCountdown);
		} // final action
	}).start();
}
/**
 * EOF Phone validation js
 ***/


/**
 * Recaptcha
 */
function initCaptcha() {
	var Captcha_api_url = "https://www.google.com/recaptcha/api.js?hl=" + window.lang;
	if (!isScriptLoaded(Captcha_api_url)) {
		var tag, firstScriptTag;
		tag = document.createElement('script');
		tag.src = Captcha_api_url;
		tag.async = true;
		firstScriptTag = document.getElementsByTagName('script')[0];
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	}
}

function showCaptcha() {
	initCaptcha();
	whenAvailable('grecaptcha', function () {
		$('#LauncherLogin .fields>.login>.captcha.item').removeClass('hidden');
		resizeWindow(null, null);
	});
}

function hideCaptcha() {
	$('#LauncherLogin .fields>.login>.captcha.item').addClass('hidden');
	whenAvailable('grecaptcha', function () {
		try {
			window.setTimeout(function () {
				if (typeof grecaptcha.reset === 'function') {
					grecaptcha.reset();
				} else {
					window.setTimeout(arguments.callee, interval);
				}
			}, 100);
		} catch (e) {
			console.log(e);
		}
		resizeWindow(null, null);
	});
}
/**
 * EOF Recaptcha
 */