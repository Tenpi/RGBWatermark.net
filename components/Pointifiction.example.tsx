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

const PointImage: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [pointSpacing, setPointSpacing] = useState(0)
    const [pointRandomness, setPointRandomness] = useState(0)
    const [pointBrightness, setPointBrightness] = useState(0)
    const [pointContrast, setPointContrast] = useState(0)
    const [pointSize, setPointSize] = useState(1)
    const [pointMethod, setPointMethod] = useState("point")
    const [pointInvert, setPointInvert] = useState(false)
    const [pointShift, setPointShift] = useState(false)
    const [pointAngle, setPointAngle] = useState(0)
    const [pointVariance, setPointVariance] = useState(0)
    const [pointFill, setPointFill] = useState("#000000")
    const [pointAlpha, setPointAlpha] = useState(true)
    const [triDirection, setTriDirection] = useState("△")
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
    const applyPointifiction = (outputType?: string) => {
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
            applyPointifiction()
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
    }, [img, pointSize, pointSpacing, pointRandomness, pointBrightness, pointContrast, pointMethod, pointInvert, pointShift, pointAngle, pointVariance, pointFill, pointAlpha, triDirection, seed, gifData])

    useEffect(() => {
        setSeed(Math.floor(Math.random() * 1000))
    }, [pointRandomness, pointVariance])

    const jpg = async () => {
        draw(0, true)
        const img = applyPointifiction("image/jpeg") as string
        let nameExt = "pointified"
        if (pointMethod === "line") nameExt = "lineified"
        if (pointMethod === "tri") nameExt = "triangified"
        if (pointMethod === "rect") nameExt = "rectified"
        functions.download(`${path.basename(imageName, path.extname(imageName))}_${nameExt}.jpg`, img)
    }

    const png = async () => {
        draw(0, true)
        const img = applyPointifiction("image/png") as string
        let nameExt = "pointified"
        if (pointMethod === "line") nameExt = "lineified"
        if (pointMethod === "tri") nameExt = "triangified"
        if (pointMethod === "rect") nameExt = "rectified"
        functions.download(`${path.basename(imageName, path.extname(imageName))}_${nameExt}.png`, img)
    }

    const zip = async () => {
        if (!gifData) return
        const zip = new JSZip()
        let nameExt = "pointified"
        if (pointMethod === "line") nameExt = "lineified"
        if (pointMethod === "tri") nameExt = "triangified"
        if (pointMethod === "rect") nameExt = "rectified"
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const img = applyPointifiction("image/png") as string
                const data = await fetch(img).then((r) => r.arrayBuffer())
                zip.file(`${path.basename(imageName, path.extname(imageName))}_${nameExt} ${i + 1}.png`, data, {binary: true})
            }
        } else {
            draw(0, true)
            const img = applyPointifiction("image/png") as string
            const data = await fetch(img).then((r) => r.arrayBuffer())
            zip.file(`${path.basename(imageName, path.extname(imageName))}_${nameExt} 1.png`, data, {binary: true})
        }
        const filename = `${path.basename(imageName, path.extname(imageName))}_${nameExt}.zip`
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
                const frame = applyPointifiction("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applyPointifiction("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const dimensions = getOutputDimensions()
        const buffer = await functions.encodeGIF(frames, delays, dimensions.width, dimensions.height, {transparentColor: "#000000"})
        const blob = new Blob([buffer])
        const url = window.URL.createObjectURL(blob)
        let nameExt = "pointified"
        if (pointMethod === "line") nameExt = "lineified"
        if (pointMethod === "tri") nameExt = "triangified"
        if (pointMethod === "rect") nameExt = "rectified"
        functions.download(`${path.basename(imageName, path.extname(imageName))}_${nameExt}.gif`, url)
        window.URL.revokeObjectURL(url)
    }

    const mp4 = async () => {
        if (!img) return
        let frames = [] as any
        let delays = [] as any
        if (gifData) {
            for (let i = 0; i < gifData.length; i++) {
                draw(i, true)
                const frame = applyPointifiction("buffer") as ArrayBuffer
                frames.push(frame)
                let delay = gifData[i].delay
                delays.push(delay)
            }
        } else {
            draw(0, true)
            const frame = applyPointifiction("buffer") as ArrayBuffer
            frames.push(frame)
            let delay = 60
            delays.push(delay)
        }
        const url = await functions.encodeVideo(frames, functions.msToFps(delays[0]))
        let nameExt = "pointified"
        if (pointMethod === "line") nameExt = "lineified"
        if (pointMethod === "tri") nameExt = "triangified"
        if (pointMethod === "rect") nameExt = "rectified"
        functions.download(`${path.basename(imageName, path.extname(imageName))}_${nameExt}.mp4`, url)
        window.URL.revokeObjectURL(url)
    }

    const reset = () => {
        setPointSpacing(0)
        setPointSize(1)
        setPointRandomness(0)
        setPointBrightness(0)
        setPointContrast(0)
        setPointMethod("point")
        setPointInvert(false)
        setPointAngle(0)
        setPointVariance(0)
        setPointFill("#000000")
        setPointAlpha(true)
        setTriDirection("△")
    }

    useEffect(() => {
        const savedPointSize = localStorage.getItem("pointSize")
        if (savedPointSize) setPointSize(Number(savedPointSize))
        const savedPointSpacing = localStorage.getItem("pointSpacing")
        if (savedPointSpacing) setPointSpacing(Number(savedPointSpacing))
        const savedPointRandomness = localStorage.getItem("pointRandomness")
        if (savedPointRandomness) setPointRandomness(Number(savedPointRandomness))
        const savedPointBrightness = localStorage.getItem("pointBrightness")
        if (savedPointBrightness) setPointBrightness(Number(savedPointBrightness))
        const savedPointContrast = localStorage.getItem("pointContrast")
        if (savedPointContrast) setPointContrast(Number(savedPointContrast))
        const savedPointMethod = localStorage.getItem("pointMethod")
        if (savedPointMethod) setPointMethod(savedPointMethod)
        const savedPointInvert = localStorage.getItem("pointInvert")
        if (savedPointInvert) setPointInvert(savedPointInvert === "true")
        const savedPointAngle = localStorage.getItem("pointAngle")
        if (savedPointAngle) setPointAngle(Number(savedPointAngle))
        const savedPointVariance = localStorage.getItem("pointVariance")
        if (savedPointVariance) setPointAngle(Number(savedPointVariance))
        const savedPointFill = localStorage.getItem("pointFill")
        if (savedPointFill) setPointFill(savedPointFill)
        const savedPointAlpha = localStorage.getItem("pointAlpha")
        if (savedPointAlpha) setPointAlpha(savedPointAlpha === "true")
        const savedTriDirection = localStorage.getItem("triDirection")
        if (savedTriDirection) setTriDirection(savedTriDirection)
    }, [])

    useEffect(() => {
        localStorage.setItem("pointSize", String(pointSize))
        localStorage.setItem("pointSpacing", String(pointSpacing))
        localStorage.setItem("pointRandomness", String(pointRandomness))
        localStorage.setItem("pointBrightness", String(pointBrightness))
        localStorage.setItem("pointContrast", String(pointContrast))
        localStorage.setItem("pointMethod", pointMethod)
        localStorage.setItem("pointInvert", String(pointInvert))
        localStorage.setItem("pointAngle", String(pointAngle))
        localStorage.setItem("pointVariance", String(pointVariance))
        localStorage.setItem("pointFill", pointFill)
        localStorage.setItem("pointAlpha", String(pointAlpha))
        localStorage.setItem("triDirection", triDirection)
    }, [pointSize, pointSpacing, pointRandomness, pointBrightness, pointContrast, pointMethod, pointInvert, pointAngle, pointFill, pointAlpha, pointVariance, triDirection])

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
                    <img className="point-checkbox" src={pointInvert ? checkboxChecked : checkbox} onClick={() => setPointInvert((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                    <button className="point-button-small" onClick={() => setPointMethod("point")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${pointMethod === "point" ? "button-text-selected" : ""}`}>Point</span>
                        </span>
                    </button>
                    <button className="point-button-small" onClick={() => setPointMethod("line")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${pointMethod === "line" ? "button-text-selected" : ""}`}>Line</span>
                        </span>
                    </button>
                    <button className="point-button-small" onClick={() => setPointMethod("tri")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${pointMethod === "tri" ? "button-text-selected" : ""}`}>Tri</span>
                        </span>
                    </button>
                    <button className="point-button-small" onClick={() => setPointMethod("rect")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${pointMethod === "rect" ? "button-text-selected" : ""}`}>Rect</span>
                        </span>
                    </button>
                    <span className="point-text-mini" style={{width: "38px", fontSize: "20px"}}>Fill:</span>
                    <input className="colorstop" type="color" value={pointFill} onChange={(event) => setPointFill(event.target.value)} style={{marginRight: "5px"}}/>
                    <span className="point-text-mini" style={{width: "55px", fontSize: "20px"}}>Alpha?</span>
                    <img className="point-checkbox" src={pointAlpha ? checkboxChecked : checkbox} onClick={() => setPointAlpha((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                </div>
                {pointMethod === "tri" ?
                <div className="point-row">
                    <button className="point-button-small" onClick={() => setTriDirection("△")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${triDirection === "△" ? "button-text-selected" : ""}`}>△</span>
                        </span>
                    </button>
                    <button className="point-button-small" onClick={() => setTriDirection("▽")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${triDirection === "▽" ? "button-text-selected" : ""}`}>▽</span>
                        </span>
                    </button>
                    <button className="point-button-small" onClick={() => setTriDirection("△▽")} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small ${triDirection === "△▽" ? "button-text-selected" : ""}`}>△▽</span>
                        </span>
                    </button>
                </div> : null}
                {pointMethod === "rect" ?
                <div className="point-row">
                    <button className="point-button-small" onClick={() => setPointRandomness((prev: number) => prev+1)} style={{marginLeft: "10px"}}>
                        <span className="button-hover">
                            <span className={`point-button-text-small`}>Change Seed</span>
                        </span>
                    </button>
                </div> : null}
                {pointMethod === "line" ?
                <div className="point-row">
                    <span className="point-text">Angle: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setPointAngle(value)} min={-45} max={45} step={1} value={pointAngle}/>
                    <span className="point-text-mini">{pointAngle}</span>
                </div> : null}
                <div className="point-row">
                    <span className="point-text">Spacing: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setPointSpacing(value)} min={0} max={100} step={1} value={pointSpacing}/>
                    <span className="point-text-mini">{pointSpacing}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Size: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setPointSize(value)} min={1} max={50} step={1} value={pointSize}/>
                    <span className="point-text-mini">{pointSize}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Variance: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setPointVariance(value)} min={0} max={25} step={1} value={pointVariance}/>
                    <span className="point-text-mini">{pointVariance}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Brightness: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setPointBrightness(value)} min={0} max={100} step={1} value={pointBrightness}/>
                    <span className="point-text-mini">{pointBrightness}</span>
                </div>
                <div className="point-row">
                    <span className="point-text">Contrast: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setPointContrast(value)} min={0} max={100} step={1} value={pointContrast}/>
                    <span className="point-text-mini">{pointContrast}</span>
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

export default PointImage