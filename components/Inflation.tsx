import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {EnableDragContext, MobileContext, GIFSpeedContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext, ImageContext, OutputSizeContext, ImageNameContext, ReverseContext, patterns} from "../Context"
import functions from "../structures/Functions"
import Slider from "react-slider"
import gifReverseIcon from "../assets/icons/gif/gif-reverse.png"
import gifSpeedIcon from "../assets/icons/gif/gif-speed.png"
import gifClearIcon from "../assets/icons/gif/gif-clear.png"
import gifPlayIcon from "../assets/icons/gif/gif-play.png"
import gifPauseIcon from "../assets/icons/gif/gif-pause.png"
import gifRewindIcon from "../assets/icons/gif/gif-rewind.png"
import gifFastforwardIcon from "../assets/icons/gif/gif-fastforward.png"
import gifFullscreenIcon from "../assets/icons/gif/gif-fullscreen.png"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import {Image} from "image-js"
import inflationCorner from "../assets/icons/inflationcorner.png"
import "./styles/pointimage.less"

let gifPos = 0
let timeout = null as any

const Inflation: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [appendBytes, setAppendBytes] = useState("10")
    const [gifData, setGIFData] = useState(null) as any
    const [seed, setSeed] = useState(0)
    const [img, setImg] = useState(null as HTMLImageElement | null)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {gifSpeed, setGIFSpeed} = useContext(GIFSpeedContext)
    const [showSpeedSlider, setShowSpeedSlider] = useState(false)
    const [secondsProgress, setSecondsProgress] = useState(0)
    const [progress, setProgress] = useState(0)
    const [dragProgress, setDragProgress] = useState(0) as any
    const [dragging, setDragging] = useState(false)
    const [seekTo, setSeekTo] = useState(null) as any
    const [paused, setPaused] = useState(false)
    const [duration, setDuration] = useState(0)
    const gifControls = useRef<HTMLDivElement>(null)
    const gifSpeedRef = useRef(null) as any
    const gifSliderRef = useRef<any>(null)
    const gifSpeedSliderRef = useRef<any>(null)
    const [fileSize, setFileSize] = useState("")
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    useEffect(() => {
        if (gifSliderRef.current) gifSliderRef.current.resize()
        if (gifSpeedSliderRef.current) gifSpeedSliderRef.current.resize()
    })

    const getFilter = () => {
        if (typeof window === "undefined") return
        const bodyStyles = window.getComputedStyle(document.body)
        const color = bodyStyles.getPropertyValue("--text")
        return functions.calculateFilter(color)
    }

    const getFilter2 = () => {
        return `hue-rotate(${siteHue - 189}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 50}%)`
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
                const bmp = result?.mime === "image/bmp"
                const tiff = result?.mime === "image/tiff"
                const avif = path.extname(file.name) === ".avif"
                const ppm = path.extname(file.name) === ".ppm"
                const tga = path.extname(file.name) === ".tga"
                const jxl = path.extname(file.name) === ".jxl"
                const svg = path.extname(file.name) === ".svg"
                // if (jpg || png || gif || webp || bmp || tiff || avif) {
                const blob = new Blob([bytes])
                const url = URL.createObjectURL(blob)
                const link = `${url}#.${result.typename}`
                setImage(link)
                setImageName(file.name.slice(0, 30))
                // }
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

    const updateOutputSize = async () => {
        const r = await fetch(image)
        const size = Number(r.headers.get("Content-Length"))
        const fullSize = size + (Number(appendBytes) * 1024 * 1024)
        setFileSize(functions.readableFileSize(fullSize))
    }

    useEffect(() => {
        updateOutputSize()
    }, [appendBytes])

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

    const apply = (outputType?: string) => {
        if (!ref.current) return 
        const ctx = ref.current.getContext("2d")!
        if (outputType === "buffer") {
            const img = ctx.getImageData(0, 0, ref.current.width, ref.current.height)
            return img.data.buffer
        }
        return ref.current.toDataURL(outputType ? outputType : "image/png")
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
        let id = 0
        let delay = 1000
        if (gifData) {
            if (timeout) clearTimeout(timeout)
            if (paused && !dragging) return
            const adjustedData = functions.gifSpeed(gifData, gifSpeed)
            const frames = adjustedData.length - 1
            const duration = adjustedData.map((d: any) => d.delay).reduce((p: any, c: any) => p + c) / 1000
            let interval = duration / frames
            let sp = seekTo !== null ? seekTo : secondsProgress
            if (dragging) sp = dragProgress
            let pos = Math.floor(sp / interval)
            if (!adjustedData[pos]) pos = 0
            delay = adjustedData[pos].delay
            setDuration(duration)

            const update = () => {
                if (reverse) {
                    pos--
                } else {
                    pos++
                }
                if (pos > adjustedData.length - 1) pos = 0
                if (pos < 0) pos = adjustedData.length - 1
                if (delay < 0) delay = 0
                const secondsProgress = (pos * interval)
                setSecondsProgress(secondsProgress)
                setProgress((secondsProgress / duration) * 100)
                gifPos = pos
                if (gifSpeed > 1) gifPos = Math.floor(pos * gifSpeed)
                if (gifPos > gifData.length - 1) gifPos -= gifData.length - 1
                if (gifPos < 0) gifPos += adjustedData.length - 1

            }

            const gifLoop = async () => {
                draw(gifPos)
                if (paused) return clearTimeout(timeout)
                update()
                await new Promise<void>((resolve) => {
                    clearTimeout(timeout)
                    timeout = setTimeout(() => {
                        resolve()
                    }, delay)
                }).then(gifLoop)
            }
            gifLoop()
        } else {
            draw(0)
        } return () => {
            clearTimeout(timeout)
            window.cancelAnimationFrame(id)
        }
    }, [img, seed, gifData, reverse, seekTo, paused, gifSpeed, dragging, dragProgress])

    const inflate = async (getLink?: boolean) => {
        const arrayBuffer = await fetch(image).then((r) => r.arrayBuffer())
        let len = Number(appendBytes) * 1000 * 1000
        let arr = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
            arr[i] = Math.floor(Math.random() * 256)
        }
        let concatenated = functions.concatTypedArrays(new Uint8Array(arrayBuffer), arr)
        const blob = new Blob([concatenated])
        const url = URL.createObjectURL(blob)
        if (getLink) return url
        functions.download(path.basename(imageName, path.extname(imageName)) + path.extname(image), url)
    }

    useEffect(() => {
        if (!dragging && dragProgress !== null) {
            setSecondsProgress(dragProgress)
            setProgress((dragProgress / duration) * 100)
            setDragProgress(null)
        }
    }, [dragging, dragProgress])

    const updateProgressText = (value: number) => {
        let percent = value / 100
        if (reverse === true) {
            const secondsProgress = (1-percent) * duration
            setDragProgress(duration - secondsProgress)
        } else {
            const secondsProgress = percent * duration
            setDragProgress(secondsProgress)
        }
    }

    const seek = (position: number) => {
        let secondsProgress = reverse ? (duration / 100) * (100 - position) : (position / 100) * duration
        let progress = (duration / 100) * position
        setProgress(progress)
        setDragging(false)
        setSeekTo(secondsProgress)
    }

    const changeReverse = (value?: boolean) => {
        const val = value !== undefined ? value : !reverse 
        let secondsProgress = val === true ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        if (gifData) secondsProgress = (duration / 100) * progress
        setReverse(val)
        setSeekTo(secondsProgress)
    }

    const changePaused = () => {
        let secondsProgress = (duration / 100) * progress
        setPaused((prev) => !prev)
        setSeekTo(secondsProgress)
    }

    const controlMouseEnter = () => {
        if (gifControls.current) gifControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowSpeedSlider(false)
        if (gifControls.current) gifControls.current.style.opacity = "0"
    }

    const getGIFPlayIcon = () => {
        if (paused) return gifPlayIcon
        return gifPauseIcon
    }

    const getGIFSpeedMarginRight = () => {
        const controlRect = gifControls.current?.getBoundingClientRect()
        const rect = gifSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = 2
        return `${raw + offset}px`
    }

    const gifReset = () => {
        changeReverse(false)
        setGIFSpeed(1)
        setPaused(false)
        setShowSpeedSlider(false)
        setTimeout(() => {
            seek(0)
        }, 300)
    }

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
                <div className="point-image-relative-container">
                    <img className="point-image-corner-img" src={inflationCorner}/>
                    <div className="gif-relative-ref">
                    <canvas className="point-image" ref={ref}></canvas>
                    {gifData ?
                    <div className="gif-controls" ref={gifControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                        <div className="gif-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} style={{filter: getFilter2()}}>
                            <p className="gif-control-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                            <Slider ref={gifSliderRef} className="gif-slider" trackClassName="gif-slider-track" thumbClassName="gif-slider-thumb" min={0} max={100} value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(reverse ? 100 - value : value)}/>
                            <p className="gif-control-text">{functions.formatSeconds(duration)}</p>
                        </div>
                        <div className="gif-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="gif-control-row-container">
                                <img className="gif-control-img" onClick={() => changeReverse()} src={gifReverseIcon} style={{filter: getFilter2()}}/>
                                <img className="gif-control-img" ref={gifSpeedRef} src={gifSpeedIcon} onMouseEnter={() => setShowSpeedSlider(true)} onMouseLeave={() => setShowSpeedSlider(false)} onClick={() => setShowSpeedSlider((prev: boolean) => !prev)} style={{filter: getFilter2()}}/>
                            </div> 
                            <div className="gif-control-row-container">
                                <img className="gif-control-img" onClick={() => changePaused()} src={getGIFPlayIcon()} style={{filter: getFilter2()}}/>
                            </div>    
                            <div className="gif-control-row-container">
                                <img className="gif-control-img" src={gifClearIcon} onClick={gifReset} style={{filter: getFilter2()}}/>
                            </div>
                        </div>
                        <div className={`gif-speed-dropdown ${showSpeedSlider ? "" : "hide-speed-dropdown"}`} style={{marginRight: getGIFSpeedMarginRight(), marginTop: "-100px"}} //-260
                        onMouseEnter={() => {setShowSpeedSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowSpeedSlider(false); setEnableDrag(true)}}>
                            <Slider ref={gifSpeedSliderRef} invert orientation="vertical" className="gif-speed-slider" trackClassName="gif-speed-slider-track" thumbClassName="gif-speed-slider-thumb"
                            value={gifSpeed} min={0.5} max={2} step={0.1} onChange={(value) => setGIFSpeed(value)}/>
                        </div>
                    </div> : null}
                </div>
                </div>
            </div> : null}
            {image ?
            <div className="point-image-container">
                <div className="point-image-buttons-container">
                    <button className="point-image-button" onClick={() => inflate()}>Inflate</button>
                </div>
                <div className="point-row">
                    <span className="point-image-output-text">Append Bytes:</span>
                    <input className="point-image-output-input" type="text" spellCheck="false" value={appendBytes} onChange={(event) => setAppendBytes(event.target.value)} onMouseOver={() => setEnableDrag(false)}/>
                    <span className="point-image-output-text">MB</span>
                </div>
                <div className="point-row">
                    <span className="point-image-output-text">{fileSize}</span>
                </div>
            </div> : null}
        </div>
    )
}

export default Inflation