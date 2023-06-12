// @ts-nocheck
import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {EnableDragContext, MobileContext, ImageContext, OutputSizeContext, ImageNameContext, ReverseContext, patterns} from "../Context"
import functions from "../structures/Functions"
import Slider from "react-slider"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import JSZip from "jszip"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import "./styles/pointimage.less"

let gifPos = 0

const SprinkleImage: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [sprinklePointSize, setSprinklePointSize] = useState(3)
    const [sprinklePointSpacing, setSprinklePointSpacing] = useState(100)
    const [sprinkleDuplicates, setSprinkleDuplicates] = useState(4)
    const [sprinkleSpacing, setSprinkleSpacing] = useState(35)
    const [sprinkleOpacity, setSprinkleOpacity] = useState(100)
    const [sprinkleDirection, setSprinkleDirection] = useState("45")
    const [gifData, setGIFData] = useState(null) as any
    const [img, setImg] = useState(null as HTMLImageElement | null)
    const [seed, setSeed] = useState(0)
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    const getFilter = () => {
        if (typeof window === "undefined") return
        const bodyStyles = window.getComputedStyle(document.body)
        const color = bodyStyles.getPropertyValue("--text")
        return functions.calculateFilter(color)
    }

    const loadImage = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                if (jpg || png || gif || webp) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    const link = `${url}#.${result.typename}`
                    setImage(link)
                    setImageName(file.name.slice(0, 30))
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const removeImage = () => {
        setImage("")
        setImageName("")
    }

    const getOutputDimensions = () => {
        if (!img) return {width: 0, height: 0}
        let destSize = outputSize
        if (Number.isNaN(destSize)) destSize = 100
        const width = Math.floor((destSize / 100) * img.width)
        const height = Math.floor((destSize / 100) * img.height)
        return {width, height}
    }

    const draw = (gifPos: number, renderWidth?: boolean) => {
        if (!ref.current || !img) return ""
        const refCtx = ref.current.getContext("2d")!
        refCtx.clearRect(0, 0, ref.current.width, ref.current.height)
        if (renderWidth) {
            const dimensions = getOutputDimensions()
            ref.current.width = dimensions.width
            ref.current.height = dimensions.height
        } else {
            let greaterValue = img.width > img.height ? img.width : img.height
            const ratio = greaterValue / 1000
            ref.current.width = Math.floor(img.width / ratio)
            ref.current.height = Math.floor(img.height / ratio)
        }
        refCtx.save()
        if (gifData) {
            const frame = gifData[gifPos].frame
            let delay = gifData[gifPos].delay
            if (delay < 0) delay = 0
            refCtx?.drawImage(frame, 0, 0, img.width, img.height, 0, 0, ref.current.width, ref.current.height)
        } else {
            refCtx?.drawImage(img, 0, 0, img.width, img.height, 0, 0, ref.current.width, ref.current.height)
        }
        refCtx.restore()
    }

    const applySprinkles = (outputType?: string) => {
    }

    const loadImg = () => {
        if (!image) return setImg(null)
        const imgElement = document.createElement("img")
        imgElement.src = image
        imgElement.onload = () => {
            if (!ref.current) return
            ref.current.width = imgElement.width
            ref.current.height = imgElement.height
            setImg(imgElement)
        }
    }

    const parseGIF = async () => {
        const frames = await functions.extractGIFFrames(image)
        setGIFData(frames)
    }

    const parseAnimatedWebP = async () => {
        const arraybuffer = await fetch(image).then((r) => r.arrayBuffer())
        const animated = await functions.isAnimatedWebp(arraybuffer)
        if (!animated) return 
        const frames = await functions.extractAnimatedWebpFrames(image)
        setGIFData(frames)
    }

    useEffect(() => {
        setGIFData(null)
        loadImg()
        if (functions.isGIF(image)) parseGIF()
        if (functions.isWebP(image)) parseAnimatedWebP()
    }, [image])

    useEffect(() => {
        let timeout = null as any
        const animationLoop = async () => {
            draw(gifPos)
            applySprinkles()
            if (gifData) {
                if (reverse) {
                    gifPos--
                } else {
                    gifPos++
                }
                if (gifPos > gifData.length - 1) gifPos = 0
                if (gifPos < 0) gifPos = gifData.length - 1
            }
            await new Promise<void>((resolve) => {
                clearTimeout(timeout)
                let delay = gifData ? gifData[gifPos].delay / 2 : 10000
                timeout = setTimeout(() => {
                    resolve()
                }, delay)
            }).then(animationLoop)
        }
        animationLoop()
        return () => {
            clearTimeout(timeout)
        }
    }, [img, sprinkleOpacity, sprinklePointSize, sprinklePointSpacing, sprinkleDuplicates, sprinkleSpacing, sprinkleDirection, seed, gifData])

    const jpg = async () => {
        draw(0, true)
        const img = applySprinkles("image/jpeg") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_sprinkles.jpg`, img)
    }

    const png = async () => {
        draw(0, true)
        const img = applySprinkles("image/png") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_sprinkles.png`, img)
    }

    const zip = async () => {
        if (!gifData) return
        const zip = new JSZip()
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const img = applySprinkles("image/png") as string
                const data = await fetch(img).then((r) => r.arrayBuffer())
                zip.file(`${path.basename(imageName, path.extname(imageName))}_sprinkles ${i + 1}.png`, data, {binary: true})
            }
        } else {
            draw(0, true)
            const img = applySprinkles("image/png") as string
            const data = await fetch(img).then((r) => r.arrayBuffer())
            zip.file(`${path.basename(imageName, path.extname(imageName))}_sprinkles 1.png`, data, {binary: true})
        }
        const filename = `${path.basename(imageName, path.extname(imageName))}_sprinkles.zip`
        const blob = await zip.generateAsync({type: "blob"})
        const url = window.URL.createObjectURL(blob)
        functions.download(filename, url)
        window.URL.revokeObjectURL(url)
    }

    const gif = async () => {
        if (!img) return
        let frames = [] as any
        let delays = [] as any
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const frame = applySprinkles("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applySprinkles("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const dimensions = getOutputDimensions()
        const buffer = await functions.encodeGIF(frames, delays, dimensions.width, dimensions.height, {transparentColor: "#000000"})
        const blob = new Blob([buffer])
        const url = window.URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}_sprinkles.gif`, url)
        window.URL.revokeObjectURL(url)
    }

    const mp4 = async () => {
        if (!img) return
        let frames = [] as any
        let delays = [] as any
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const frame = applySprinkles("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applySprinkles("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const url = await functions.encodeVideo(frames, functions.msToFps(delays[0]))
        functions.download(`${path.basename(imageName, path.extname(imageName))}_sprinkles.mp4`, url)
        window.URL.revokeObjectURL(url)
    }

    const reset = () => {
        setSprinkleOpacity(100)
        setSprinklePointSize(3)
        setSprinkleDuplicates(4)
        setSprinklePointSpacing(100)
        setSprinkleSpacing(35)
        setSprinkleDirection("45")
    }

    useEffect(() => {
        const savedSprinkleOpacity = localStorage.getItem("sprinkleOpacity")
        if (savedSprinkleOpacity) setSprinkleOpacity(Number(savedSprinkleOpacity))
        const savedSprinkleDuplicates = localStorage.getItem("sprinkleDuplicates")
        if (savedSprinkleDuplicates) setSprinkleDuplicates(Number(savedSprinkleDuplicates))
        const savedSprinkleSpacing = localStorage.getItem("sprinkleSpacing")
        if (savedSprinkleSpacing) setSprinkleSpacing(Number(savedSprinkleSpacing))
        const savedSprinklePointSize = localStorage.getItem("sprinklePointSize")
        if (savedSprinklePointSize) setSprinklePointSize(Number(savedSprinklePointSize))
        const savedSprinklePointSpacing = localStorage.getItem("sprinklePointSpacing")
        if (savedSprinklePointSpacing) setSprinklePointSpacing(Number(savedSprinklePointSpacing))
        const savedSprinkleDirection = localStorage.getItem("sprinkleDirection")
        if (savedSprinkleDirection) setSprinkleDirection(savedSprinkleDirection)
    }, [])

    useEffect(() => {
        localStorage.setItem("sprinkleOpacity", String(sprinkleOpacity))
        localStorage.setItem("sprinkleDuplicates", String(sprinkleDuplicates))
        localStorage.setItem("sprinkleSpacing", String(sprinkleSpacing))
        localStorage.setItem("sprinklePointSize", String(sprinklePointSize))
        localStorage.setItem("sprinklePointSpacing", String(sprinklePointSpacing))
        localStorage.setItem("sprinkleDirection", sprinkleDirection)
    }, [sprinkleOpacity, sprinkleDuplicates, sprinkleSpacing, sprinklePointSize, sprinklePointSpacing, sprinkleDirection])

    return (
        <div className="point-image-component" onMouseEnter={() => setEnableDrag(true)}>
            <div className="point-upload-container">
                <div className="point-row">
                    <span className="point-text">Image:</span>
                </div>
                <div className="point-row">
                    <label htmlFor="img" className="point-button" style={{width: "119px"}}>
                        <span className="button-hover">
                            <span className="button-text">Upload</span>
                            <img className="button-image" src={uploadIcon}/>
                        </span>
                    </label>
                    <input id="img" type="file" onChange={(event) => loadImage(event)}/>
                    {image ? 
                        <div className="button-image-name-container">
                            <img className="button-image-icon" src={xIcon} style={{filter: getFilter()}} onClick={removeImage}/>
                            <span className="button-image-name">{imageName}</span>
                        </div>
                    : null}
                </div>
            </div>
            {image ?
            <div className="point-image-container">
                <canvas className="point-image" ref={ref}></canvas>
            </div> : null}
            <div className="point-options-container">
                <div className="point-row">
                    <button className="point-button-small" onClick={() => setSprinkleDirection("-45")}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${sprinkleDirection === "-45" ? "button-text-selected" : ""}`}>-45</span>
                        </span>
                    </button>
                    <button className="point-button-small" onClick={() => setSprinkleDirection("0")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${sprinkleDirection === "0" ? "button-text-selected" : ""}`}>0</span>
                        </span>
                    </button>
                    <button className="point-button-small" onClick={() => setSprinkleDirection("45")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${sprinkleDirection === "45" ? "button-text-selected" : ""}`}>45</span>
                        </span>
                    </button>
                    <button className="point-button-small" onClick={() => setSprinkleDirection("90")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${sprinkleDirection === "90" ? "button-text-selected" : ""}`}>90</span>
                        </span>
                    </button>
                </div>
                <div className="point-row">
                    <span className="point-text">Opacity: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setSprinkleOpacity(value)} min={0} max={100} step={1} value={sprinkleOpacity}/>
                    <span className="point-text-mini">{sprinkleOpacity}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Spacing: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setSprinkleSpacing(value)} min={1} max={100} step={1} value={sprinkleSpacing}/>
                    <span className="point-text-mini">{sprinkleSpacing}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Duplicates: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setSprinkleDuplicates(value)} min={0} max={10} step={1} value={sprinkleDuplicates}/>
                    <span className="point-text-mini">{sprinkleDuplicates*2}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Point Size: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setSprinklePointSize(value)} min={1} max={10} step={1} value={sprinklePointSize}/>
                    <span className="point-text-mini">{sprinklePointSize}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Point Spacing: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setSprinklePointSpacing(value)} min={50} max={250} step={1} value={sprinklePointSpacing}/>
                    <span className="point-text-mini">{sprinklePointSpacing}</span>
                </div>
            </div>
            {image ?
            <div className="point-image-container">
                <div className="point-image-buttons-container">
                    <button className="point-image-button" onClick={jpg}>JPG</button>
                    <button className="point-image-button" onClick={png}>PNG</button>
                    <button className="point-image-button" onClick={zip}>ZIP</button>
                    <button className="point-image-button" onClick={gif}>GIF</button>
                    <button className="point-image-button" onClick={mp4}>MP4</button>
                </div>
                <div className="point-row">
                    <span className="point-image-output-text">Output Size:</span>
                    <input className="point-image-output-input" type="text" spellCheck="false" value={outputSize} onChange={(event) => setOutputSize(event.target.value)} onMouseOver={() => setEnableDrag(false)}/>
                </div>
                <div className="point-row">
                    <span className="point-image-output-text">{getOutputDimensions().width}x{getOutputDimensions().height}</span>
                </div>
            </div> : null}
            <div className="point-options-container">
                <div className="point-row">
                    <button className="point-button" onClick={reset} style={{padding: "0px 5px", marginTop: "7px"}}>
                        <span className="button-hover">
                            <span className="button-text">Reset</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default SprinkleImage