import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path, { resolve } from "path"
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
import utif from "utif"
import bmpJS from "bmp-js"
import * as avifJS from "@jsquash/avif"
import * as webpJS from "@jsquash/webp"
import * as jxlJS from "@tenpi/jxl"
import TGA from "tga"
import ImageTracer from "imagetracerjs"
import {Canvg} from "canvg"
import {optimize} from "svgo"
import conversionCorner from "../assets/icons/conversioncorner.png"
import "./styles/pointimage.less"

let gifPos = 0
let timeout = null as any
let canvasRenderer = null as any

const Conversion: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {image, setImage} = useContext(ImageContext)
    const {imageName, setImageName} = useContext(ImageNameContext)
    const {outputSize, setOutputSize} = useContext(OutputSizeContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const [svgColorRatio, setSVGColorRatio] = useState(0)
    const [previewSVG, setPreviewSVG] = useState(false)
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
                // if (jpg || png || gif || webp) {
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

    const startSVGPreview = async () => {
        if (!ref.current) return 
        const ctx = ref.current.getContext("2d")!
        const url = await svg(true)
        canvasRenderer = await Canvg.from(ctx, url!)
        canvasRenderer.start()
    }

    const stopSVGPreview = async () => {
        if (canvasRenderer) canvasRenderer.stop()
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
                if (previewSVG) {
                    return startSVGPreview()
                } else {
                    stopSVGPreview()
                }
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
            if (previewSVG) {
                startSVGPreview()
            } else {
                stopSVGPreview()
            }
        } return () => {
            clearTimeout(timeout)
            window.cancelAnimationFrame(id)
        }
    }, [img, seed, gifData, reverse, seekTo, paused, gifSpeed, dragging, dragProgress, previewSVG, svgColorRatio])

    const webp = async () => {
        if (!ref.current) return
        draw(0, true)
        const ctx = ref.current?.getContext("2d")!
        const pixels = ctx.getImageData(0, 0, ref.current.width, ref.current.height)
        const webpBuffer = await webpJS.encode(pixels)
        const blob = new Blob([webpBuffer])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}.webp`, url)
    }

    const avif = async () => {
        if (!ref.current) return
        draw(0, true)
        const ctx = ref.current?.getContext("2d")!
        const pixels = ctx.getImageData(0, 0, ref.current.width, ref.current.height)
        const avifBuffer = await avifJS.encode(pixels)
        const blob = new Blob([avifBuffer])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}.avif`, url)
    }

    const jxl = async () => {
        if (!ref.current) return
        draw(0, true)
        const ctx = ref.current?.getContext("2d")!
        const pixels = ctx.getImageData(0, 0, ref.current.width, ref.current.height)
        const jxlBuffer = await jxlJS.encode(pixels)
        const blob = new Blob([jxlBuffer])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}.jxl`, url)
    }

    const bmp = async () => {
        draw(0, true)
        const arrayBuffer = apply("buffer") as ArrayBuffer
        const dimensions = getOutputDimensions()
        const pixels = new Uint8Array(arrayBuffer).slice()
        for (let i = 0; i < pixels.length; i+=4) {
            const red = pixels[i + 0]
            const green = pixels[i + 1]
            const blue = pixels[i + 2]
            const alpha = pixels[i + 3]
            pixels[i + 0] = alpha
            pixels[i + 1] = blue
            pixels[i + 2] = green
            pixels[i + 3] = red
        }
        const newBuffer = bmpJS.encode({data: Buffer.from(pixels.buffer), width: dimensions.width, height: dimensions.height})
        const blob = new Blob([newBuffer.data])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}.bmp`, url)
    }

    const tiff = async () => {
        draw(0, true)
        const arrayBuffer = apply("buffer") as ArrayBuffer
        const dimensions = getOutputDimensions()
        const newBuffer = utif.encodeImage(arrayBuffer, dimensions.width, dimensions.height)
        const blob = new Blob([newBuffer])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}.tiff`, url)
    }

    const tga = async () => {
        if (!ref.current) return
        draw(0, true)
        const ctx = ref.current?.getContext("2d")!
        const pixels = ctx.getImageData(0, 0, ref.current.width, ref.current.height)
        let tgaBuffer = TGA.createTgaBuffer(pixels.width, pixels.height, pixels.data);
        const blob = new Blob([tgaBuffer])
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}.tga`, url)
    }

    const ppm = async () => {
        if (!ref.current) return
        draw(0, true)
        const ctx = ref.current?.getContext("2d")!
        let string = ""
        string += "P3\n"
        string += `${ref.current.width} ${ref.current.height}\n`
        string += "255\n"
        
        let pxData = [...ctx.getImageData(0,0, ref.current.width, ref.current.height).data]
        for (let i = 0; i < pxData.length; i++) {
            if ((i+1) % 4 == 0) continue
            string += pxData[i] + " "
        }
        const blob = new Blob([string], {type: "image/x-portable-pixmap"})
        const url = URL.createObjectURL(blob)
        functions.download(`${path.basename(imageName, path.extname(imageName))}.ppm`, url)
    }

    const svg = async (preview?: boolean) => {
        if (!ref.current) return
        draw(0, true)
        const ctx = ref.current?.getContext("2d")!
        const pixels = ctx.getImageData(0, 0, ref.current.width, ref.current.height)
        const result = ImageTracer.imagedataToSVG(pixels, {numberofcolors: 24, mincolorratio: svgColorRatio})
        const optimized = optimize(result)
        const blob = new Blob([optimized.data])
        const url = URL.createObjectURL(blob)
        if (preview) return url
        functions.download(`${path.basename(imageName, path.extname(imageName))}.svg`, url)
    }

    const reset = () => {
        setSVGColorRatio(0)
    }

    useEffect(() => {
        const savedSVGColorRatio = localStorage.getItem("svgColorRatio")
        if (savedSVGColorRatio) setSVGColorRatio(Number(savedSVGColorRatio))
    }, [])

    useEffect(() => {
        localStorage.setItem("svgColorRatio", String(svgColorRatio))
    }, [svgColorRatio])

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
                    <img className="point-image-corner-img" src={conversionCorner}/>
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
            <div className="point-options-container">
                <div className="point-row">
                    <span className="point-text-mini" style={{width: "135px", fontSize: "20px"}}>Preview SVG?</span>
                    <img className="point-checkbox" src={previewSVG ? checkboxChecked : checkbox} onClick={() => setPreviewSVG((prev: boolean) => !prev)} style={{filter: getFilter(), margin: "0px"}}/>
                </div>
                <div className="point-row">
                    <span className="point-text">SVG Color Ratio: </span>
                    <Slider className="point-slider" trackClassName="point-slider-track" thumbClassName="point-slider-thumb" onChange={(value) => setSVGColorRatio(value)} min={0} max={24} step={1} value={svgColorRatio}/>
                    <span className="point-text-mini">{svgColorRatio}</span>
                </div>
            </div>
            {image ?
            <div className="point-image-container">
                <div className="point-image-buttons-container">
                    <button className="point-image-button" onClick={webp}>WEBP</button>
                    <button className="point-image-button" onClick={avif}>AVIF</button>
                    <button className="point-image-button" onClick={jxl}>JXL</button>
                    <button className="point-image-button" onClick={bmp}>BMP</button>
                    <button className="point-image-button" onClick={tiff}>TIFF</button>
                    <button className="point-image-button" onClick={tga}>TGA</button>
                    <button className="point-image-button" onClick={ppm}>PPM</button>
                    <button className="point-image-button" onClick={() => svg()}>SVG</button>
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

export default Conversion