config.widgetFamily = config.widgetFamily || 'medium'

// Text sizes
const majorSizeData = 18
const fontSizeData = 17
const lineNumberData = 1
const minimumScaleFactor = 1 // Value between 1.0 and 0.1

// Number of data by Size
const numberOfDisplayedDataBySize = {  
  small: 1,
  medium: 2,
  large: 4
}

// Colors
let backColor = new Color('FFFFFF')
let backColor2 = new Color('EDEDED')
let textColor = new Color('000000')
// let lastUpdateColor = new Color('E9ECEF')
let lastUpdateColor = new Color('6C757D')

let newCaseColor = new Color('F7A437')
let newDeathColor = new Color('B74D34')
let newRecovedColor = new Color('65C64C')
let activeCasesColor = new Color('0D6EFD')
let firstDoseColor = new Color('0CC4E9')
let totalCasesColor = new Color('F7A437')

let textColors = [
    newCaseColor,
    newDeathColor,
    newRecovedColor,
    activeCasesColor,
    firstDoseColor,
    totalCasesColor
]

if (true) {
    backColor = Color.dynamic(backColor, new Color('111111'))
    backColor2 = Color.dynamic(backColor2, new Color('222222'))
    textColor = Color.dynamic(textColor, new Color('EDEDED'))
}

// Get coloring dependant on the percentage
function signColouring(percentage) {
	let colorCode = ''
	if (percentage >= 0) { colorCode = positiveColor}
	if (percentage < 0) { colorCode = negativeColor}

	return colorCode
}

// fetches the covid stats
async function fetchCovidStats() {

    // let url = "https://covid19.place/forms/u";
	// const req = new Request(url);
	// const apiResult = await req.loadJSON();

    let url = "https://covid19.place/?country=MY"

    let wv = new WebView()
    await wv.loadURL(url)
    let getData = `
        function getData(){
            console.log("get data", D);    

            return JSON.stringify(D)
        }
        getData()
    `
    let resultDataString = await wv.evaluateJavaScript(getData)

    let apiResult = JSON.parse(resultDataString);

    console.log(apiResult);

    let datePointer = -1; // Today = -1, Yesterday = -2

    let todayNewCase = apiResult.GRAPH_STATS.new.cases.val.slice(datePointer)[0];

    if (todayNewCase === 0 || todayNewCase === "") {
        datePointer = -2;
    }

    let lastUpdate = apiResult.GRAPH_STATS.new.cases.date.slice(datePointer)[0];
    
    let newCasesDetails = {
        title: apiResult.GRAPH_TITLE.REGION.new.cases, 
        val: apiResult.GRAPH_STATS.new.cases.val.slice(datePointer)[0]
    }

    let newDeathsDetails = {
        title: apiResult.GRAPH_TITLE.REGION.new.deaths, 
        val: apiResult.GRAPH_STATS.new.deaths.val.slice(datePointer)[0]
    }

    let newRecoveredDetails = {
        title: apiResult.GRAPH_TITLE.REGION.new.recovered, 
        val: apiResult.GRAPH_STATS.new.recovered.val.slice(datePointer)[0]
    }

    let activeCasesDetails = {
        title: apiResult.GRAPH_TITLE.REGION.total.active, 
        val: apiResult.GRAPH_STATS.total.active.val.slice(datePointer)[0]
    }

    let totalDosesDetails = {
        title: apiResult.GRAPH_TITLE.REGION.total.doses, 
        val: apiResult.GRAPH_STATS.total.doses.val.slice(datePointer)[0]
    }

    let totalCasesDetails = {
        title: apiResult.GRAPH_TITLE.REGION.total.cases, 
        val: apiResult.GRAPH_STATS.total.cases.val.slice(datePointer)[0]
    }

    let dailySummary = [];
    dailySummary.push(
        newCasesDetails,
        newDeathsDetails,
        newRecoveredDetails,
        activeCasesDetails,
        totalDosesDetails,
        totalCasesDetails
    );

    let resultData = {
        dailySummary: dailySummary,
        lastUpdate: lastUpdate
    }

    return resultData;
}

// get images from local filestore or download them once
async function getImage(image) {
	let fm = FileManager.local()
	let dir = fm.documentsDirectory()
	let path = fm.joinPath(dir, image)
	if (fm.fileExists(path)) {
		return fm.readImage(path)
	} else {
		// download once
		let imageUrl
		switch (image) {
			case 'malaysia':
				imageUrl = "https://cdn.countryflags.com/thumbs/malaysia/flag-round-250.png"
				break
			default:
				console.log(`Sorry, couldn't find ${image}.`);
		}

		let iconImage = await loadImage(imageUrl)
		fm.writeImage(path, iconImage)
		return iconImage
	}
}

// helper function to download an image from a given url
async function loadImage(imgUrl) {
	const req = new Request(imgUrl)
	return await req.loadImage()
}

async function prepareMediumWidget(widget, covidStats) {
    let firstLineStack = widget.addStack()

    const coin = await getImage('malaysia')
	const coinImg = firstLineStack.addImage(coin)
	coinImg.imageSize = new Size(25, 25)
	coinImg.cornerRadius = 15

    firstLineStack.layoutHorizontally()
	firstLineStack.addSpacer(8)

	let providerRow = firstLineStack.addStack()
	providerRow.layoutVertically()

    let providerText = providerRow.addText("COVID-19 Statistics")
    providerText.font = Font.mediumSystemFont(majorSizeData)
    providerText.textColor = textColor

    let lastUpdateText = providerRow.addText(`last update ${covidStats.lastUpdate}`)
	lastUpdateText.font = Font.mediumRoundedSystemFont(12)
    lastUpdateText.textColor = lastUpdateColor
    
    widget.addSpacer()

    // Statistics Info Row
    const infoStack = widget.addStack()
    infoStack.layoutHorizontally()

    // Detail Row
    const stack = widget.addStack()
    stack.layoutHorizontally()

    let i = 0
    let row2

    covidStats.dailySummary.forEach((v) => {
        if (i < textColors.length) {
            v.valueColor = textColors[i];
        }
        if (++i % 3 == 1) {
            row2 = widget.addStack()
            row2.layoutHorizontally()
            widget.addSpacer(10)
        }
        column = row2.addStack()
        column.layoutVertically()
        column.centerAlignContent()

        // Summary Values
        let displayTitle;
        displayTitle = v.title
        textStack = column.addStack()
        textStack.layoutHorizontally()
        textStack.addSpacer()
        let diagramText = textStack.addText(displayTitle)
        diagramText.font = Font.mediumSystemFont(fontSizeData - 4)
        diagramText.minimumScaleFactor = minimumScaleFactor
        diagramText.lineLimit = lineNumberData
        diagramText.centerAlignText()
        textStack.addSpacer()

        displayValue = column.addStack()
        displayValue.layoutHorizontally()
        displayValue.addSpacer()
        let diagramName = displayValue.addText(v.val.toString())
        diagramName.font = Font.systemFont(fontSizeData)
        diagramName.minimumScaleFactor = minimumScaleFactor
        diagramName.lineLimit = lineNumberData
        diagramName.centerAlignText()
        diagramName.textColor = v.valueColor
        displayValue.addSpacer()
    })
}

async function main() {
     // Create Widget
    let widget = new ListWidget()
    widget.url = 'https://covid19.place/?lang=en-US#statistics'

    const covidStats = await fetchCovidStats()

    widget.setPadding(10, 10, 10, 10)

    if (covidStats != undefined) {

        const gradient = new LinearGradient()
        gradient.locations = [0, 1]
        gradient.colors = [
            backColor,
            backColor2
        ]
        widget.backgroundGradient = gradient

        switch (config.widgetFamily) {
            case 'small': await prepareMediumWidget(widget, covidStats); break;
            case 'medium': await prepareMediumWidget(widget, covidStats); break;
            case 'large': await prepareMediumWidget(widget, covidStats); break;
            default: await prepareMediumWidget(widget, covidStats); break;
        }

    } else {
        let fallbackText = widget.addText("Unexpected error.")
        fallbackText.font = Font.mediumSystemFont(12)
        fallbackText.textColor = textColor
    }

    if (!config.runsInWidget) {
        switch (config.widgetFamily) {
            case 'small': await widget.presentMedium(); break;
            case 'medium': await widget.presentMedium(); break;
            case 'large': await widget.presentMedium(); break;
            default: await widget.presentMedium(); break;
        }

    } else {
        // Tell the system to show the widget.
        Script.setWidget(widget)
        Script.complete()
    }
}

module.exports = {
    main
};