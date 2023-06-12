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

const HighContrastImage: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [highContrastStrength, setHighContrastStrength] = useState(0)
    const [highContrastSize, setHighContrastSize] = useState(1)
    const [highContrastBrightness, setHighContrastBrightness] = useState(0)
    const [highContrastContrast, setHighContrastContrast] = useState(0)
    const [highContrastInvert, setHighContrastInvert] = useState(false)
    const [highContrastSpacing, setHighContrastSpacing] = useState(1)
    const [gifData, setGIFData] = useState(null) as any
    const [img, setImg] = useState(null as HTMLImageElement | null)
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

    const applyHighContrast = (outputType?: string) => {
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
            applyHighContrast()
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
    }, [img, highContrastSize, highContrastStrength, highContrastBrightness, highContrastContrast, highContrastInvert, highContrastSpacing, gifData])

    const jpg = async () => {
        draw(0, true)
        const img = applyHighContrast("image/jpeg") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_highcontrast.jpg`, img)
    }

    const png = async () => {
        draw(0, true)
        const img = applyHighContrast("image/png") as string
        functions.download(`${path.basename(imageName, path.extname(imageName))}_highcontrast.png`, img)
    }

    const zip = async () => {
        if (!gifData) return
        const zip = new JSZip()
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const img = applyHighContrast("image/png") as string
                const data = await fetch(img).then((r) => r.arrayBuffer())
                zip.file(`${path.basename(imageName, path.extname(imageName))}_highcontrast ${i + 1}.png`, data, {binary: true})
            }
        } else {
            draw(0, true)
            const img = applyHighContrast("image/png") as string
            const data = await fetch(img).then((r) => r.arrayBuffer())
            zip.file(`${path.basename(imageName, path.extname(imageName))}_highcontrast 1.png`, data, {binary: true})
        }
        const filename = `${path.basename(imageName, path.extname(imageName))}_highcontrast.zip`
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
                const frame = applyHighContrast("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applyHighContrast("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const dimensions = getOutputDimensions()
        const buffer = await functions.encodeGIF(frames, delays, dimensions.width, dimensions.height, {transparentColor: "#000000"})
        const blob = new Blob([buffer])
        const url = window.URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}_highcontrast.gif`, url)
        window.URL.revokeObjectURL(url)
    }

    const mp4 = async () => {
        if (!img) return
        let frames = [] as any
        let delays = [] as any
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const frame = applyHighContrast("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applyHighContrast("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const url = await functions.encodeVideo(frames, functions.msToFps(delays[0]))
        functions.download(`${path.basename(imageName, path.extname(imageName))}_highcontrast.mp4`, url)
        window.URL.revokeObjectURL(url)
    }

    const reset = () => {
        setHighContrastSize(1)
        setHighContrastStrength(0)
        setHighContrastBrightness(0)
        setHighContrastContrast(0)
        setHighContrastSpacing(1)
        setHighContrastInvert(false)
    }

    useEffect(() => {
        const savedHighContrastSize = localStorage.getItem("highContrastSize")
        if (savedHighContrastSize) setHighContrastSize(Number(savedHighContrastSize))
        const savedHighContrastStrength = localStorage.getItem("highContrastStrength")
        if (savedHighContrastStrength) setHighContrastStrength(Number(savedHighContrastStrength))
        const savedHighContrastBrightness = localStorage.getItem("highContrastBrightness")
        if (savedHighContrastBrightness) setHighContrastBrightness(Number(savedHighContrastBrightness))
        const savedHighContrastContrast = localStorage.getItem("highContrastContrast")
        if (savedHighContrastContrast) setHighContrastContrast(Number(savedHighContrastContrast))
        const savedHighContrastInvert = localStorage.getItem("highContrastInvert")
        if (savedHighContrastInvert) setHighContrastInvert(savedHighContrastInvert === "true")
        const savedHighContrastSpacing = localStorage.getItem("highContrastSpacing")
        if (savedHighContrastSpacing) setHighContrastSpacing(Number(savedHighContrastSpacing))
    }, [])

    useEffect(() => {
        localStorage.setItem("highContrastSize", String(highContrastSize))
        localStorage.setItem("highContrastStrength", String(highContrastStrength))
        localStorage.setItem("highContrastBrightness", String(highContrastBrightness))
        localStorage.setItem("highContrastContrast", String(highContrastContrast))
        localStorage.setItem("highContrastSpacing", String(highContrastSpacing))
        localStorage.setItem("highContrastInvert", String(highContrastInvert))
    }, [highContrastSize, highContrastStrength, highContrastBrightness, highContrastContrast, highContrastInvert, highContrastSpacing])

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
                    <span className="point-text-mini" style={{width: "55px", fontSize: "20px"}}>Invert?</span>
                    <img className="point-checkbox" src={highContrastInvert ? checkboxChecked : checkbox} onClick={() => setHighContrastInvert((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                </div>
                <div className="point-row">
                    <span className="point-text">Strength: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setHighContrastStrength(value)} min={1} max={100} step={1} value={highContrastStrength}/>
                    <span className="point-text-mini">{highContrastStrength}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Size: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setHighContrastSize(value)} min={1} max={25} step={1} value={highContrastSize}/>
                    <span className="point-text-mini">{highContrastSize}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Spacing: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setHighContrastSpacing(value)} min={1} max={50} step={1} value={highContrastSpacing}/>
                    <span className="point-text-mini">{highContrastSpacing}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Brightness: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setHighContrastBrightness(value)} min={0} max={100} step={1} value={highContrastBrightness}/>
                    <span className="point-text-mini">{highContrastBrightness}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Contrast: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setHighContrastContrast(value)} min={0} max={100} step={1} value={highContrastContrast}/>
                    <span className="point-text-mini">{highContrastContrast}</span>
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

export default HighContrastImage