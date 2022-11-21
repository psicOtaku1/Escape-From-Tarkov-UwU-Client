let selectedCatId = false,
	selectedCat = false,
	stepInputDefaults = [],
	bugReportStepLimit = 15

$(document).ready(function () {
	whenAvailable('launcher', function () {
		try {
			onWindowInitComplete()

			$('#bug_text').keyup(function (e) {
				validateForm()
				searchKnowledgeBase()
			})

			$('#bug_category').on('change', function (e) {
				$('#page #message>.container').addClass('hidden')
				window.selectedCatId = $(this).val()
				window.selectedCat = window.supportConfiguration.categories.find(cat => cat.category_id === window.selectedCatId)
				let inputDefaults = window.selectedCat && window.selectedCat.inputTexts ? window.selectedCat.inputTexts : []
				window.stepInputDefaults = inputDefaults && inputDefaults.step ? inputDefaults.step : ''
				console.log('change bug_category prepareZip')
				prepareZip()
				removeSteps()
				$('#bug_text').val('').attr('placeholder', inputDefaults && inputDefaults.text && inputDefaults.text[0] ? inputDefaults.text[0] : '')
				if (window.selectedCatId) {
					$('#page #message>.container').removeClass('hidden')
				}
				if (window.selectedCat && parseInt(window.selectedCat.clientLogsRequired)) {
					$('#addClientLogsCheckbox').prop('checked', true).attr('disabled', 'disabled')
				} else {
					$('#addClientLogsCheckbox').prop('checked', true).removeAttr('disabled', 'disabled')
				}
				if (window.selectedCat && parseInt(window.selectedCat.launcherLogsRequired)) {
					$('#addLauncherLogsCheckbox').prop('checked', true).attr('disabled', 'disabled')
				} else {
					$('#addLauncherLogsCheckbox').prop('checked', true).removeAttr('disabled', 'disabled')
				}
			})

			$('#addClientLogsCheckbox').on('change', function (e) {
				prepareZip()
			})
			$('#addLauncherLogsCheckbox').on('change', function (e) {
				prepareZip()
			})

			$(document).on('click', '#submit_report', function (e) {
				e.preventDefault()
				if (!$(this).hasClass('disabled')) {
					let data = prepareZip()
					if (0 >= data['message'].length) {
						try {
							launcher.showError(i18next.t("Field \"Describe your problem\" can not be empty"))
						} catch (e) {
							console.log(e)
						}
					} else if (1000 < data['message'].length) {
						try {
							launcher.showError(i18next.t("Field \"Describe your problem\" is too long"))
						} catch (e) {
							console.log(e)
						}
					} else {
						launcher.sendBugReport(
							data['category']+'',
							data['message'],
							data['files'],
							getGameLogsFreshnessSec(),
							getGameLogsSizeLimit(),
							document.getElementById('addLauncherLogsCheckbox').checked,
							document.getElementById('collectInfoCheckbox').checked
						)
					}
				}
			})

			$(document).on('click', '#add_files', function (e) {
				launcher.showBugReportSelectionDialog(i18next.t("Add files")).then(function (data) {
					data = $.parseJSON(data)
					if (window.environment !== "Production") {
						console.log(data)
					}
					if (data && data.selected_files) {
						$.each(data.selected_files, function (i, v) {
							if (!$('[data-file="' + v.path + '"]').length) {
								let filename = v.path.split('/').pop()
								$('[data-selected-files]').append(
									'<li data-file="' + v.path + '">' + filename +
									'<div class="button inline" data-remove><i class="icon exit"></i></div>' +
									'</li>')
							}
						})
						$('[data-remove]').off('click').on('click', function () {
							$(this).parent().remove()
							prepareZip()
						})
					}
					prepareZip()
				})
			})

		} catch (e) {
			console.log(e)
		}
	})
})


function validateForm() {
	let inputText = $('#bug_text').val(),
		isValidTextLow = 0 < inputText.length,
		isValidTextHight = 1000 >= inputText.length,
		isValidText = isValidTextLow && isValidTextHight,
		fileSize = $('#page .foot .size_info'),
		isValidFileSize = !fileSize.hasClass('error')

	if (!isValidText) {
		$('label[for="bug_text"]').addClass('error')
	} else {
		$('label[for="bug_text"]').removeClass('error')
	}

	if (isValidText && isValidFileSize) {
		$('#submit_report').removeClass('disabled')
	} else {
		$('#submit_report').addClass('disabled')
	}
}


function preparePostData() {
	let data = {},
		files = [],
		selected_cat = window.selectedCatId

	$('[data-file]').each(function () {
		files.push($(this).attr('data-file'))
	})

	data['message'] = $('#bug_text').val() + '\r\n' + '\r\n'
	if($('[data-step-list] .step-item').length) {
		data['message'] += i18next.t("Reproduce steps") + '\r\n'
		$('[data-step-list] .step-item').each(function () {
			data['message'] += $(this).text() + ' ' + $(this).find('input').val() + ' ' + '\r\n'
		})
	}


	data['category'] = parseInt(selected_cat)
	data['files'] = files
	return data
}

function prepareZip() {
	let data = preparePostData()
	launcher.calculateSize(data['files'],
		getGameLogsFreshnessSec(),
		getGameLogsSizeLimit(),
		document.getElementById('addLauncherLogsCheckbox').checked
	).then(function (result) {
		if(result >= 0) {
			renderBugReportBytes(parseInt(result))
			if (parseInt(result) > window.supportConfiguration.postMaxSize) {
				$('#page .foot .size_info').addClass('error')
			} else {
				$('#page .foot .size_info').removeClass('error')
			}
		}
	}).then(function () {
		validateForm()
	})
	return data
}

function renderBugReportBytes(bytes) {
	try {
		if (bytes < 1048576) { //KB
			$('#size_info_current').text((bytes / 1024).toFixed(0))
			$('#size_info_current + .dimension').text(i18next.t("KB"))
		} else { //MB
			$('#size_info_current').text((bytes / 1048576).toFixed(0))
			$('#size_info_current + .dimension').text(i18next.t("MB"))
		}
		var percent = bytes * 100 / window.supportConfiguration.postMaxSize
		if (percent > 100) {
			percent = 100
		}
		widgetProgressBarProgress(percent)
	} catch (e) {
		console.log(e)
	}
}

function getSupportConfiguration() {
	var cacheKey = 'supportConfiguration_' + window.lang,
		data = getContentCache(cacheKey)
	if (null === data) {
		siteRequest('support/configuration', {lang: window.lang}, function (data) {
			data = JSON.parse(data)
			if (window.environment !== 'Production') {
				console.log(data)
			}
			if (typeof data === 'object') {
				setContentCache(cacheKey, data, Date.now() + window.contentCacheInterval)
				window.supportConfiguration = data
				renderBugCategories(data.categories)
				renderWarning(data.warning)
				if(data.postMaxSize && data.postMaxSize !== window.settings.maxBugReportSize) {
					launcher.setSettings(JSON.stringify({maxBugReportSize: data.postMaxSize ?? window.settings.maxBugReportSize}))
				}
				$('#size_info_limit').text(parseInt((data.postMaxSize ?? window.settings.maxBugReportSize) / 1048576 + ''))
			}
		})
	} else {
		renderBugCategories(data.categories)
		renderWarning(data.warning)
	}
}

function renderWarning(warning) {
	$('[data-support-warning]').html(warning)
}

function renderBugCategories(supportCategories) {
	$('#bug_category').html('<option></option>')
	$(supportCategories).each(function (i, val) {
		$('#bug_category').append('<option value="' + val.category_id + '">' + val.name + '</option>')
	})
	$('#bug_category').select2(s2opt).removeClass('hidden')
}

function onWindowInitComplete() {
	initSteps()
	whenJqueryFuncAvailable('localize', function () {
		$('#message').localize()
	})
}

function initSteps() {
	$('[data-step-add]').on('click', function () {
		if(!$(this).hasClass('disabled')) {
			let index = $('[data-step-list]').children().length,
				value = window.stepInputDefaults ? window.stepInputDefaults[index] : ''

			if(index < bugReportStepLimit) {
				addStep(index + 1, value)
			} else {
				$('[data-step-add]').addClass('disabled');
			}
		}
	})
}

function addStep(index, value) {
	let item = $('<div></div>', {class: 'step-item'}),
		labelText = '<span data-i18n="Step">' + i18next.t('Step') + '</span> <span class="wrap"><span data-index>' + index + '</span>:</span>',
		id = 'step_' + index
	item.append($('<label for="' + id + '" class="inline">' + labelText + '</label>'))
	item.append($('<input/>', {type: 'text', id: id, placeholder: value}))
	item.append($('<div class="button inline" data-step-remove><i class="icon exit"></i></div>'))
	$('[data-step-list]').append(item)
	$('[data-step-remove]').off('click').on('click', function () {
		removeStep($(this).parent())
	})
}

function removeStep($element) {
	$element.remove()
	reIndexStep()
	if($('[data-step-list]').children().length < bugReportStepLimit) {
		$('[data-step-add]').removeClass('disabled');
	}
}

function removeSteps() {
	$('[data-step-list]').html('')
	$('[data-step-add]').removeClass('disabled');
}

function reIndexStep() {
	$('[data-step-list] [data-index]').each(function (i) {
		$(this).text(i + 1)
	})
}

function searchKnowledgeBase() {
	// delay(function () {
	// 	$('[data-search-results]').html('')
	// 	$('#searchOnSite').remove()
	// 	let params = {
	// 		message: $('#bug_text').val(),
	// 		category: $('#bug_category').val(),
	// 		language: window.lang
	// 	}
	// 	if (params.message) {
	// 		siteRequest('support/knowledge/search', params, function (response) {
	// 			response = JSON.parse(response)
	// 			if (response.data) {
	// 				$.each(response.data, function (i, v) {
	// 					$('[data-search-results]')
	// 						.append('<li id="knowlege_' + v.id + '" class="out"><a href="' + window.site_url + v.link + '" target="_blank">' + v.text + '</a></li>')
	// 				})
	// 			}
	// 			let route = window.site_url + '/support/' + params.category,
	// 				query = encodeURI('search=' + params.message + '&lang=' + params.language)
	// 			$('[data-search-results]').parent()
	// 				.append('<a id="searchOnSite" href="' + route + '?' + query + '" target="_blank" data-i18n="Search articles on the website">'
	// 					+ i18next.t("Search articles on the website") +
	// 					'</a>')
	// 		})
	// 	}
	// }, 300000)
}

function getGameLogsFreshnessSec() {
	return document.getElementById('addClientLogsCheckbox').checked && window.supportConfiguration.gameLogsFreshnessSec
		? window.supportConfiguration.gameLogsFreshnessSec : 0
}

function getGameLogsSizeLimit() {
	return document.getElementById('addClientLogsCheckbox').checked && window.supportConfiguration.gameLogsSizeLimit
		? window.supportConfiguration.gameLogsSizeLimit : 0
}