import GifEncoder from "gif-encoder"
import pixels from "image-pixels"
import path from "path"
import axios from "axios"
import fileType from "magic-bytes.js"
import gifFrames from "gif-frames"
import {hexToRgb, Color, Solver} from "./Color"
import {createFFmpeg, fetchFile} from "@ffmpeg/ffmpeg"
import * as mm from "music-metadata-browser"
import {ID3Writer} from "browser-id3-writer"
import lamejs from "lamejs"
import * as oggEncoder from "vorbis-encoder-js"
import * as Flac from "libflacjs/dist/libflac.js"
import {FlacEncoder} from "./FlacEncoder"
import {guess} from "web-audio-beat-detector"

let newScrollY = 0
let lastScrollTop = 0
let newScrollX = 0
let lastScrollLeft = 0
let element = null as any
let inertia = false
let mouseDown = false
let stopInertia = false

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".bmp", ".tiff"]
const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"]

const ffmpeg = createFFmpeg()

export default class Functions {
    public static isSafari = () => {
        // @ts-ignore
        return /constructor/i.test(window.HTMLElement) || (function (p) {return p.toString() === "[object SafariRemoteNotification]" })(!window["safari"] || (typeof safari !== "undefined" && safari.pushNotification))
    }

    public static decodeEntities(encodedString: string) {
        const regex = /&(nbsp|amp|quot|lt|gt);/g
        const translate = {
            nbsp: " ",
            amp : "&",
            quot: "\"",
            lt  : "<",
            gt  : ">"
        }
        return encodedString.replace(regex, function(match, entity) {
            return translate[entity]
        }).replace(/&#(\d+);/gi, function(match, numStr) {
            const num = parseInt(numStr, 10)
            return String.fromCharCode(num)
        })
    }

    public static cleanHTML = (str: string) => {
        return Functions.decodeEntities(str).replace(/<\/?[^>]+(>|$)/g, "")
    }
    
    public static removeDuplicates = <T>(array: T[]) => {
        return array.filter((value, index) => {
            return index === array.findIndex(obj => {
              return JSON.stringify(obj) === JSON.stringify(value)
            })
        })
    }

    public static formatSeconds = (duration: number) => {
        let seconds = Math.floor(duration % 60) as any
        let minutes = Math.floor((duration / 60) % 60) as any
        let hours = Math.floor((duration / (60 * 60)) % 24) as any
        if (Number.isNaN(seconds) || seconds < 0) seconds = 0
        if (Number.isNaN(minutes) || minutes < 0) minutes = 0
        if (Number.isNaN(hours) || hours < 0) hours = 0

        hours = (hours === 0) ? "" : ((hours < 10) ? "0" + hours + ":" : hours + ":")
        minutes = hours && (minutes < 10) ? "0" + minutes : minutes
        seconds = (seconds < 10) ? "0" + seconds : seconds
        return `${hours}${minutes}:${seconds}`
    }
    
    public static arrayIncludes = (str: string, arr: string[]) => {
        for (let i = 0; i < arr.length; i++) {
            if (str.includes(arr[i])) return true
        }
        return false
    }

    public static isImage = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, imageExtensions)
        }
        return Functions.arrayIncludes(path.extname(file), imageExtensions)
    }

    public static isGIF = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".gif"
        }
        return path.extname(file) === ".gif"
    }

    public static isWebP = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webp"
        }
        return path.extname(file) === ".webp"
    }

    public static isAnimatedWebp = async (buffer: ArrayBuffer) => {
        let str: any
        if (typeof window === "undefined") {
            str = buffer
        } else {
            str = await new Blob([buffer]).text()
        }
        if (str.indexOf("ANMF") != -1) {
            return true
        } else {
            return false
        }
    }

    public static isVideo = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return Functions.arrayIncludes(ext, videoExtensions)
        }
        return Functions.arrayIncludes(path.extname(file), videoExtensions)
    }

    public static isMP4 = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".mp4"
        }
        return path.extname(file) === ".mp4"
    }

    public static isWebM = (file: string) => {
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webm"
        }
        return path.extname(file) === ".webm"
    }

    public static timeout = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
    
    public static toProperCase = (str: string) => {
        if (!str) return ""
        return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            }
        )
    }

    public static alphaNumeric(str: string) {
        for (let i = 0; i < str.length; i++) {
          const code = str.charCodeAt(i)
          if (!(code > 47 && code < 58) && // 0-9
              !(code > 64 && code < 91) && // A-Z
              !(code > 96 && code < 123)) { // a-z
            return false
          }
        }
        return true
    }

    public static dragScroll = (enabled?: boolean) => {
        if (inertia || mouseDown) return
        element?.removeEventListener("mousedown", element?.mouseDownFunc, false)
        window.removeEventListener("mouseup", element?.mouseUpFunc, false)
        window.removeEventListener("mousemove", element?.mouseMoveFunc, false)
        window.removeEventListener("scroll", element?.scrollFunc, false)

        element = document.querySelector(".drag") as HTMLElement
        if (!element) element = document.querySelector("body") as HTMLElement
        if (!element || !enabled) return
        let lastClientY = 0
        let lastClientX = 0
        mouseDown = false
        let time = null as any
        let id = 0
        stopInertia = false

        element.addEventListener("mousedown", element.mouseDownFunc = (event: MouseEvent) => {
                if (event.button === 2) return 
                event.preventDefault()
                Functions.clearSelection()
                // @ts-ignore
                document.activeElement.blur()
                mouseDown = true
                inertia = false
                time = new Date()
                lastClientY = event.clientY
                lastClientX = event.clientX
                let scrollElement = element
                if (element == document.body) scrollElement = document.documentElement
                lastScrollTop = scrollElement.scrollTop
                lastScrollLeft = scrollElement.scrollLeft
                cancelAnimationFrame(id)
        }, false)

        window.addEventListener("scroll", element.scrollFunc = () => {
            cancelAnimationFrame(id)
        }, false)

        window.addEventListener("mouseup", element.mouseUpFunc = (event) => {
            mouseDown = false
            if (stopInertia) return
            const timeDiff = (new Date() as any - time)
            let scrollElement = element
            if (element == document.body) scrollElement = document.documentElement
            let speedY = (scrollElement.scrollTop - lastScrollTop) / timeDiff * 25
            let speedX = (scrollElement.scrollLeft - lastScrollLeft) / timeDiff * 25
            let speedYAbsolute = Math.min(Math.abs(speedY), 500)
            let speedXAbsolute = Math.min(Math.abs(speedX), 500)

            const draw = () => {
                let scrollElement = element
                if (element == document.body) scrollElement = document.documentElement
                if (speedYAbsolute > 0 || speedXAbsolute > 0) {
                    if (speedYAbsolute > 0) {
                        if (speedY > 0) {
                            scrollElement.scrollTop += speedYAbsolute--
                        } else {
                            scrollElement.scrollTop -= speedYAbsolute--
                        }
                    }
                    if (speedXAbsolute > 0) {
                        if (speedX > 0) {
                            scrollElement.scrollLeft += speedXAbsolute--
                        } else {
                            scrollElement.scrollLeft -= speedXAbsolute--
                        }
                    }
                } else {
                    inertia = false
                }
                id = requestAnimationFrame(draw)
            }
            inertia = true
            draw()
        }, false)

        window.addEventListener("mousemove", element.mouseMoveFunc = (event) => {
            if (Math.abs(window.innerWidth - event.pageX) < 10) {
                stopInertia = true
            } else {
                stopInertia = false
            }
            if (!mouseDown) return
            let scrollElement = element
            if (element == document.body) scrollElement = document.documentElement
            newScrollY = event.clientY - lastClientY
            newScrollX = event.clientX - lastClientX
            lastClientY = event.clientY
            lastClientX = event.clientX
            scrollElement.scrollTop -= newScrollY
            if (element !== document.body) {
                scrollElement.scrollLeft -= newScrollX
            }
        }, false)
    }

    public static updateHeight = () => {
        const imageContainer = document.querySelector(".imagegrid") as HTMLElement
        if (imageContainer) {
            const height = imageContainer.clientHeight
            imageContainer.style.height = `${height}px`
        }
    }

    public static scrolledToBottom = () => {
        const c = [document.scrollingElement!.scrollHeight, document.body.scrollHeight, document.body.offsetHeight].sort(function(a,b){return b-a})
        return (window.innerHeight + window.scrollY + 2 >= c[0])
    }

    public static trimCanvas = (canvas: any) => {
        const context = canvas.getContext("2d");

        const topLeft = {
            x: canvas.width,
            y: canvas.height,
            update(x,y){
                this.x = Math.min(this.x,x);
                this.y = Math.min(this.y,y);
            }
        };

        const bottomRight = {
            x: 0,
            y: 0,
            update(x,y){
                this.x = Math.max(this.x,x);
                this.y = Math.max(this.y,y);
            }
        };

        const imageData = context.getImageData(0,0,canvas.width,canvas.height);

        for(let x = 0; x < canvas.width; x++){
            for(let y = 0; y < canvas.height; y++){
                const alpha = imageData.data[((y * (canvas.width * 4)) + (x * 4)) + 3];
                if(alpha !== 0){
                    topLeft.update(x,y);
                    bottomRight.update(x,y);
                }
            }
        }

        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;

        const croppedCanvas = context.getImageData(topLeft.x,topLeft.y,width,height);
        canvas.width = width;
        canvas.height = height;
        context.putImageData(croppedCanvas,0,0);

        return canvas;
    }

    public static download = (filename: string, url: string) => {
            const a = document.createElement("a")
            a.setAttribute("href", url)
            a.setAttribute("download", decodeURIComponent(filename))
            a.style.display = "none"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
    }

    public static round = (value: number, step?: number) => {
        if (!step) step = 1.0
        const inverse = 1.0 / step
        return Math.round(value * inverse) / inverse
    }

    public static getScrollPercent = () => {
            return (document.documentElement.scrollTop) / 
            (document.documentElement.scrollHeight - document.documentElement.clientHeight)
    }

    public static preventDragging = () => {
        document.querySelectorAll("img").forEach((img) => {
          img.draggable = false
        })
    }

    public static clearSelection() {
        window.getSelection()?.removeAllRanges()
    }

    public static getImageOrFallback = async (path: string, fallback: string) => {
        return new Promise<string>(resolve => {
          const img = new Image()
          img.src = path
          img.onload = () => resolve(path)
          img.onerror = () => resolve(fallback)
        })
    }

    public static calcDistance(elementOne: any, elementTwo: any) {
        let distance = 0
        
        const x1 = elementOne.offsetTop
        const y1 = elementOne.offsetLeft
        const x2 = elementTwo.offsetTop
        const y2 = elementTwo.offsetLeft
        const xDistance = x1 - x2
        const yDistance = y1 - y2
        
        distance = Math.sqrt(
            (xDistance * xDistance) + (yDistance * yDistance)
        )
        return distance
    }

    public static extractGIFFrames = async (gif: string) => {
        const frames = await gifFrames({url: gif, frames: "all", outputType: "canvas"})
        const newGIFData = [] as any
        for (let i = 0; i < frames.length; i++) {
            newGIFData.push({
                frame: frames[i].getImage(),
                delay: frames[i].frameInfo.delay * 10
            })
        }
        return newGIFData
    }

    public static logSlider = (position: number) => {
        const minPos = 0
        const maxPos = 1
        const minValue = Math.log(0.01)
        const maxValue = Math.log(1)
        const scale = (maxValue - minValue) / (maxPos - minPos)
        const value = Math.exp(minValue + scale * (position - minPos))
        return value
      }

    private static parseTransparentColor = (color: string) => {
        return Number(`0x${color.replace(/^#/, "")}`)
    }

    public static streamToBuffer = async (stream: NodeJS.ReadableStream) => {
        const chunks: Buffer[] = []
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
          stream.on("error", (err) => reject(err))
          stream.on("end", () => resolve(Buffer.concat(chunks)))
        })
        return buffer
    }

    public static encodeGIF = async (frames: Buffer[], delays: number[], width: number, height: number, options?: {transparentColor?: string}) => {
        if (!options) options = {} as {transparentColor?: string}
        const gif = new GifEncoder(width, height, {highWaterMark: 5 * 1024 * 1024})
        gif.setQuality(10)
        gif.setRepeat(0)
        gif.writeHeader()
        if (options?.transparentColor) gif.setTransparent(Functions.parseTransparentColor(options.transparentColor))
        let counter = 0

        const addToGif = async (frames: Buffer[]) => {
            if (!frames[counter]) {
                gif.finish()
            } else {
                const {data} = await pixels(frames[counter], {width, height})
                gif.setDelay(delays[counter])
                gif.addFrame(data)
                counter++
                addToGif(frames)
            }
        }
        await addToGif(frames)
        return Functions.streamToBuffer(gif as NodeJS.ReadableStream)
    }

    public static msToFps = (ms: number) => {
        return Math.floor(1 / ((ms / 2) / 100))
    }

    public static encodeVideo = async (frames: string[], framerate?: number, audio?: string) => {
        if (!ffmpeg.isLoaded()) await ffmpeg.load()
        for (let i = 0; i < frames.length; i++) {
            const num = `00${i}`.slice(-3)
            ffmpeg.FS("writeFile", `${num}.png`, await fetchFile(frames[i]))
        }
        if (!framerate) framerate = 30
        if (audio) {
            ffmpeg.FS("writeFile", "audio.wav", await fetchFile(audio))
            await ffmpeg.run("-framerate", String(framerate), "-pattern_type", "glob", "-i", "*.png", "-i", "audio.wav", "-c:a", "aac", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "video.mp4")
        } else {
            await ffmpeg.run("-framerate", String(framerate), "-pattern_type", "glob", "-i", "*.png", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "video.mp4")
        }
        const binary = ffmpeg.FS("readFile", "video.mp4")
        let url = ""
        if (binary) {
            const blob = new Blob([new DataView(binary.buffer)], {type: "video/mp4"})
            url = URL.createObjectURL(blob)
        }
        try {
            for (let i = 0; i < frames.length; i++) {
                const num = `00${i}`.slice(-3)
                ffmpeg.FS("unlink", `${num}.png`)
            }
            ffmpeg.FS("unlink", "video.mp4")
            if (audio) ffmpeg.FS("unlink", "audio.wav")
        } catch {
            // ignore
        }
        return url
    }

    public static noteFactor = (scaleFactor: number) => {
        if (scaleFactor === 1) return 0
        if (scaleFactor < 1) {
            return Math.round(-1 * ((1 / scaleFactor) * 600))
        } else {
            return Math.round(scaleFactor * 600)
        }
    }

    public static formatDate(date: Date) {
        if (!date) return ""
        let year = date.getFullYear()
        let month = (1 + date.getMonth()).toString().padStart(2, "0")
        let day = date.getDate().toString().padStart(2, "0")
        return `${year}-${month}-${day}`
    }

    public static prettyDate = (inputDate: Date) => {
        const monthNames = [
          "January", "February", "March",
          "April", "May", "June", "July",
          "August", "September", "October",
          "November", "December"
        ]
        const date = new Date(inputDate)
        const day = date.getDate()
        const monthIndex = date.getMonth()
        const year = date.getFullYear()

        return `${monthNames[monthIndex]} ${day}, ${year}`
      }

    public static binaryToHex = (bin: string) => {
        return bin.match(/.{4}/g)?.reduce(function(acc, i) {
            return acc + parseInt(i, 2).toString(16).toUpperCase()
        }, "") || ""
    }

    public static hexToBinary = (hex: string) => {
        return hex.split("").reduce(function(acc, i) {
            return acc + ("000" + parseInt(i, 16).toString(2)).substr(-4, 4)
        }, "")
    }

    public static videoThumbnail = (link: string) => {
        return new Promise<string>((resolve) => {
            const video = document.createElement("video")
            video.src = link 
            video.addEventListener("loadeddata", (event) => {
                video.currentTime = 0.001
            })
            video.addEventListener("seeked", () => {
                const canvas = document.createElement("canvas")
                const ctx = canvas.getContext("2d") as any
                canvas.width = video.videoWidth 
                canvas.height = video.videoHeight
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
                resolve(canvas.toDataURL())
            })
            video.load()
        })
    }

    public static base64ToBuffer = (base64: string) => {
        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)!
        return Buffer.from(matches[2], "base64")
    }

    public static base64toUint8Array = async (base64: string) => {
        return fetch(base64).then((r) => r.arrayBuffer()).then((a) => new Uint8Array(a))
    }

    public static multiTrim = (str: string) => {
        return str.replace(/^\s+/gm, "").replace(/\s+$/gm, "").replace(/newline/g, " ")
    }

    public static linkExists = async (link: string) => {
        const response = await fetch(link, {method: "HEAD"}).then((r) => r.status)
        return response !== 404
    }

    public static readableFileSize = (bytes: number) => {
        const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Number((bytes / Math.pow(1024, i)).toFixed(2))} ${["B", "KB", "MB", "GB", "TB"][i]}`
    }

    public static imageDimensions = async (image: string) => {
        return new Promise<any>((resolve) => {
            if (Functions.isVideo(image)) {
                const video = document.createElement("video")
                video.addEventListener("loadedmetadata", async () => {
                    let width = video.videoWidth 
                    let height = video.videoHeight
                    try {
                        const r = await fetch(image)
                        const size = Number(r.headers.get("Content-Length"))
                        resolve({width, height, size})
                    } catch {
                        resolve({width, height, size: 0})
                    }
                })
                video.src = image
            } else {
                const img = document.createElement("img")
                img.addEventListener("load", async () => {
                    let width = img.width
                    let height = img.height
                    try {
                        const r = await fetch(image)
                        const size = Number(r.headers.get("Content-Length"))
                        resolve({width, height, size})
                    } catch {
                        resolve({width, height, size: 0})
                    }
                })
                img.src = image
            }
        })
    }

    public static createImage = async (image: string) => {
        const img = new Image()
        img.src = image
        return new Promise<HTMLImageElement>((resolve) => {
            img.onload = () => resolve(img)
        })
    }

    public static crop = async (url: string, aspectRatio: number, buffer?: boolean) => {
        return new Promise<any>((resolve) => {
            const inputImage = new Image()
            inputImage.onload = () => {
                const inputWidth = inputImage.naturalWidth
                const inputHeight = inputImage.naturalHeight
                const inputImageAspectRatio = inputWidth / inputHeight
                let outputWidth = inputWidth
                let outputHeight = inputHeight
                if (inputImageAspectRatio > aspectRatio) {
                    outputWidth = inputHeight * aspectRatio
                } else if (inputImageAspectRatio < aspectRatio) {
                    outputHeight = inputWidth / aspectRatio
                }
    
                const outputX = (outputWidth - inputWidth) * 0.5
                const outputY = (outputHeight - inputHeight) * 0.5
                const outputImage = document.createElement("canvas")
    
                outputImage.width = outputWidth
                outputImage.height = outputHeight
    
                const ctx = outputImage.getContext("2d") as any
                ctx.drawImage(inputImage, outputX, outputY)
                if (buffer) {
                    const img = ctx.getImageData(0, 0, outputImage.width, outputImage.height)
                    resolve(img.data.buffer)
                } else {
                    resolve(outputImage.toDataURL())
                }
            }
            inputImage.src = url
        })
    }

    public static arrayBufferToBase64 = (arrayBuffer: ArrayBuffer) => {
        return `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`
    }

    public static timeAgo = (input: string) => {
        const date = new Date(input.replace(/ +/g, "T"))
        const seconds = Math.floor(((new Date().getTime() / 1000) - (date.getTime() / 1000)))
        const years = seconds / 31536000
        if (years > 1) {
            const rounded = Math.floor(years)
            return `${rounded} year${rounded === 1 ? "" : "s"} ago`
        }
        const months = seconds / 2592000
        if (months > 1) {
            const rounded = Math.floor(months)
            return `${rounded} month${rounded === 1 ? "" : "s"} ago`
        }
        const days = seconds / 86400
        if (days > 1) {
            const rounded = Math.floor(days)
            return `${rounded} day${rounded === 1 ? "" : "s"} ago`
        }
        const hours = seconds / 3600
        if (hours > 1) {
            const rounded = Math.floor(hours)
            return `${rounded} hour${rounded === 1 ? "" : "s"} ago`
        }
        const minutes = seconds / 60
        if (minutes > 1) {
            const rounded = Math.floor(minutes)
            return `${rounded} minute${rounded === 1 ? "" : "s"} ago`
        }
        const rounded = Math.floor(seconds)
        return `${rounded} second${rounded === 1 ? "" : "s"} ago`
    }

    public static fileExtension = (uint8Array: Uint8Array) => {
        const result = fileType(uint8Array)?.[0]
        return result?.extension || ""
    }

    public static websiteName = (url: string) => {
        url = url.replace("en.", "")
        const base = url.match(/(https?\:\/\/)(.*?)(?=\.)/)?.[0].split("//")[1] ?? ""
        return Functions.toProperCase(base)
    }

    public static rgbToHsl = (r: any, g: any, b: any) => {
        r /= 255;
        g /= 255;
        b /= 255;
      
        let cmin = Math.min(r,g,b),
            cmax = Math.max(r,g,b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;

        if (delta == 0)
            h = 0;
        // Red is max
        else if (cmax == r)
            h = ((g - b) / delta) % 6;
        // Green is max
        else if (cmax == g)
            h = (b - r) / delta + 2;
        // Blue is max
        else
            h = (r - g) / delta + 4;
    
        h = Math.round(h * 60);
        
        // Make negative hues positive behind 360°
        if (h < 0)
            h += 360;

        l = (cmax + cmin) / 2;

        // Calculate saturation
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
            
        // Multiply l and s by 100
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        return [h, s, l]
    }

    public static hslToRgb(h: any, s: any, l: any) {
        // Must be fractions of 1
        s /= 100.0;
        l /= 100.0;
      
        let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60.0) % 2 - 1)),
        m = l - c/2.0,
        r = 0,
        g = 0,
        b = 0;
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;  
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return [r, g, b]
    } 

    public static rgbToHex(r: any, g: any, b: any) {
        r = r.toString(16)
        g = g.toString(16)
        b = b.toString(16)
      
        if (r.length == 1)
          r = "0" + r
        if (g.length == 1)
          g = "0" + g
        if (b.length == 1)
          b = "0" + b
      
        return "#" + r + g + b
    }

    public static wrap = (num: number, min: number, max: number) => {
        let newNum = num 
        if (newNum < min) newNum += max 
        if (newNum > max) newNum -= min
        return newNum
    }

    public static mod = (num: number, mod: number) => {
        if (num === mod) return num 
        return num % mod
    }

    public static isLocalHost = () => {
        if (typeof window === "undefined") return false
        return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    }

    public static calculateFilter = (hexColor: string) => {
        const rgb = hexToRgb(hexColor) as any
        if (!rgb) return ""
        const color = new Color(rgb[0], rgb[1], rgb[2])
        const solver = new Solver(color)
        const result = solver.solve()
        return result.filter
    }

    public static hexToRgb = (hexColor: string) => {
        const rgb = hexToRgb(hexColor) as any
        if (!rgb) return {r: 0, g: 0, b: 0}
        return {r: rgb[0], g: rgb[1], b: rgb[2]}
    }

    public static extractAnimatedWebpFrames = async (webp: string) => {
        const data = await fetch(webp).then((r) => r.arrayBuffer())
        let index = 0
        // @ts-ignore
        let imageDecoder = new ImageDecoder({data, type: "image/webp", preferAnimation: true})

        let result = [] as any

        while (true) {
            try {
                const decoded = await imageDecoder.decode({frameIndex: index++})
                const canvas = document.createElement("canvas") as any
                const canvasContext = canvas.getContext("2d")
                canvasContext.drawImage(decoded.image, 0, 0)
                result.push({frame: await createImageBitmap(decoded.image), delay: decoded.image.duration / 1000.0})
            } catch {
                break
            }
        }

        return result
    }

    public static random = (seed: number) => {
        let t = seed += 0x6D2B79F5
        t = Math.imul(t ^ t >>> 15, t | 1)
        t ^= t + Math.imul(t ^ t >>> 7, t | 61)
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }

    public static rotateColor = (color: string, hue: number, saturation: number, lightness: number) => {
        let hsl = [] as any
        let a = 1
        if (color.trim().startsWith("#")) {
            const rgb = hexToRgb(color) as any
            hsl = Functions.rgbToHsl(rgb[0], rgb[1], rgb[2])
        } else {
            const matches = color.match(/\d+(\.\d+)?/g)!
            hsl = Functions.rgbToHsl(Number(matches[0]), Number(matches[1]), Number(matches[2]))
            if (matches[3]) a = Number(matches[3])
        }
        const newH = Functions.mod(Functions.wrap(hsl[0] - 180 + hue, 0, 360), 360)
        const newS = Functions.mod(Functions.wrap(hsl[1] - 100 + saturation, 0 , 100), 100)
        const newL = Functions.mod(Functions.wrap(hsl[2] - 50 + lightness, 0, 100), 100)
        const newRGB = Functions.hslToRgb(newH, newS, newL)
        if (a < 1) {
            return `rgba(${newRGB[0]}, ${newRGB[1]}, ${newRGB[2]}, ${a})`
        } else {
            return Functions.rgbToHex(newRGB[0], newRGB[1], newRGB[2])
        }
    }

    public static truncateColor = (value: number) => {
        if (value < 0) {
          value = 0
        } else if (value > 255) {
          value = 255
        }
        return value
    }

    public static radians (angle: number) {
        return angle * (Math.PI / 180)
    }

    public static randomRange(min: number, max: number, seed: number = 1) {
        return Math.floor(Functions.random(seed) * (max - min + 1)) + min
    }

    public static concatTypedArrays = (a: any, b: any) => {
        let c = new (a.constructor)(a.length + b.length)
        c.set(a, 0)
        c.set(b, a.length)
        return c
    }

    public static convertToWAV = async (audio: string) => {
        const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        const audioContext = new AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        return Functions.encodeWAV(audioBuffer)
    }

    public static convertToMP3 = async (audio: string, bitrate: number = 320) => {
        const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        const audioContext = new window.AudioContext()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        return Functions.encodeMP3(audioBuffer, bitrate)
    }

    public static getOggTags = async (image?: string, metaAudio?: string) => {
        let tags = {} as any
        if (image) tags["COVERART"] = image
        if (metaAudio) {
            const metaBuffer = await fetch(metaAudio).then((r) => r.arrayBuffer())
            const tagInfo = await mm.parseBuffer(new Uint8Array(metaBuffer))
            if (tagInfo.common.title) tags["TITLE"] = tagInfo.common.title
            if (tagInfo.common.artist) tags["ARTIST"] = tagInfo.common.artist
            if (tagInfo.common.album) tags["ALBUM"] = tagInfo.common.album
            if (tagInfo.common.genre) tags["GENRE"] = tagInfo.common.genre?.join(" ")
            if (tagInfo.common.date) tags["DATE"] = tagInfo.common.date
            let comment = tagInfo.common.comment?.join(" ")
            if (!comment) {
                const key = Object.keys(tagInfo.native)[0]
                const comm = tagInfo.native[key].find((t) => t.id === "COMM:Description")
                if (comm) comment = comm.value.text
            }
            if (comment) tags["COMMENT"] = comment
        }
        return tags
    }

    public static interleave = (audioBuffer: AudioBuffer) => {
        const numChannels = audioBuffer.numberOfChannels
        const bufferLength = audioBuffer.length
        const interleavedBufferLength = numChannels * bufferLength
        const interleavedBuffer = new Int32Array(interleavedBufferLength)

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel)
            for (let i = 0; i < bufferLength; i++) {
                const interleavedIndex = i * numChannels + channel
                interleavedBuffer[interleavedIndex] = Math.round(channelData[i] * (2 ** 31 - 1))
            }
        }
        return interleavedBuffer
    }

    public static getWavInfo = (header: Uint8Array) => {
        function int32ToDec(bin: string) {
            const binArr = bin.split("-")
            let binDigits = ""
            for (let i = 0; i < binArr.length; i++) {
                binDigits += ("00000000"+Number(binArr[i]).toString(2)).slice(-8)
            }
            const num = parseInt(binDigits, 2)
            return num
        }
        let littleEndian = false
        let bitDepth = 0
        let sampleRate = 0
        let channels = 0
        let topCode = ""
        for (let i = 0; i < 4; i++) {
            topCode += String.fromCharCode(header[i])
        }
        if (topCode === "RIFF") {
            littleEndian = true
        }
        if (littleEndian) {
            bitDepth = Number(`${header[35]}${header[34]}`)
            sampleRate = Number(int32ToDec(`${(header[27])}-${(header[26])}-${(header[25])}-${(header[24])}`))
            channels = Number(`${header[23]}${header[22]}`)
        } else {
            bitDepth = Number(`${header[34]}${header[35]}`)
            sampleRate = Number(int32ToDec(`${header[24]}-${(header[25])}-${(header[26])}-${(header[27])}`))
            channels = Number(`${header[22]}${header[23]}`)
        }
        const byteDepth = (bitDepth) / 8
        return {byteDepth, bitDepth, sampleRate, channels}
    }

    public static songCover = async (audio: string) => {
        const buffer = await fetch(audio).then((r) => r.arrayBuffer())
        const tagInfo = await mm.parseBuffer(new Uint8Array(buffer))
        const picture = tagInfo.common.picture
        if (picture) {
            let buffer = new Uint8Array() as Buffer
            for (let i = 0; i < picture.length; i++) {
                buffer = Buffer.concat([buffer, picture[i].data])
            }
            return `data:${picture[0].format};base64,${buffer.toString("base64")}`
        } else {
            return ""
        }
    }

    public static writeSongCover = async (audio: string, image: string, metaAudio?: string) => {
        const audioBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        const imageBuffer = await fetch(image).then((r) => r.arrayBuffer())
        const writer = new ID3Writer(audioBuffer)
        writer.setFrame("APIC", {
            type: 3,
            data: imageBuffer,
            description: "Cover"
        })
        if (metaAudio) {
            const metaBuffer = await fetch(metaAudio).then((r) => r.arrayBuffer())
            const tagInfo = await mm.parseBuffer(new Uint8Array(metaBuffer))
            if (tagInfo.common.title) writer.setFrame("TIT2", tagInfo.common.title)
            if (tagInfo.common.artist) writer.setFrame("TPE1", [tagInfo.common.artist])
            if (tagInfo.format.duration) writer.setFrame("TLEN", String(tagInfo.format.duration))
            if (tagInfo.common.year) writer.setFrame("TYER", String(tagInfo.common.year))
            if (tagInfo.common.bpm) writer.setFrame("TBPM", String(tagInfo.common.bpm))
            if (tagInfo.common.key) writer.setFrame("TKEY", tagInfo.common.key)
            if (tagInfo.common.genre) writer.setFrame("TCON", tagInfo.common.genre)
            if (tagInfo.common.album) writer.setFrame("TALB", tagInfo.common.album)
            if (tagInfo.common.albumartist) writer.setFrame("TPE2", tagInfo.common.albumartist)
            if (tagInfo.common.track.no) writer.setFrame("TRCK", String(tagInfo.common.track.no))
            let comment = tagInfo.common.comment?.join(" ")
            if (!comment) {
                const key = Object.keys(tagInfo.native)[0]
                const comm = tagInfo.native[key].find((t) => t.id === "COMM:Description")
                if (comm) comment = comm.value.text
            }
            if (comment) writer.setFrame("COMM", {
                description: "Description",
                text: comment ?? "",
                language: "eng"
            })
        }
        writer.addTag()
        return writer.getURL()
    }

    public static reverseAudioBuffer = (audioBuffer: AudioBuffer) => {
        const channels = audioBuffer.numberOfChannels
      
        const reversedBuffer = new AudioBuffer({
          numberOfChannels: channels,
          length: audioBuffer.length,
          sampleRate: audioBuffer.sampleRate
        })
      
        for (let channel = 0; channel < channels; channel++) {
          const samples = audioBuffer.getChannelData(channel)
          const newSamples = reversedBuffer.getChannelData(channel)
          for (let i = 0; i < audioBuffer.length; i++) {
            newSamples[i] = samples[audioBuffer.length - 1 - i]
          }
        }
        return reversedBuffer
    }

    public static upsampleAudioBuffer = (audioBuffer: AudioBuffer, sampleRate: number) => {
        let originalSampleRate = audioBuffer.sampleRate
        let ratio = sampleRate / originalSampleRate
        let length = audioBuffer.length
        let upsampledLength = Math.floor(length * ratio)
        let result = new Float32Array(upsampledLength)
      
        for (let i = 0; i < upsampledLength; i++) {
          let originalIndex = Math.floor(i / ratio)
          result[i] = audioBuffer.getChannelData(0)[originalIndex]
        }
      
        let audioContext = new AudioContext()
        let newBuffer = audioContext.createBuffer(1, upsampledLength, sampleRate)
        newBuffer.getChannelData(0).set(result)
        return newBuffer
    }

    public static encodeWAV = (audioBuffer: AudioBuffer) => {
        let HEADER_LENGTH = 44
        let MAX_AMPLITUDE = 0x7FFF
        let nChannels = audioBuffer.numberOfChannels
        let bufferLength = audioBuffer.length
        let arrayBuffer = new ArrayBuffer(HEADER_LENGTH + 2 * bufferLength * nChannels)
        let int16 = new Int16Array(arrayBuffer)
        let uint8 = new Uint8Array(arrayBuffer)
        let sr = audioBuffer.sampleRate;
        let l2 = bufferLength * nChannels * 2
        let l1 = l2 + 36
        let br = sr * nChannels * 2
        uint8.set([
            0x52, 0x49, 0x46, 0x46, // R I F F
            l1 & 255, (l1 >> 8) & 255, (l1 >> 16) & 255, (l1 >> 24) & 255, // chunk size
            0x57, 0x41, 0x56, 0x45, // W A V E
            0x66, 0x6D, 0x74, 0x20, // F T M █
            0x10, 0x00, 0x00, 0x00, // sub chunk size = 16
            0x01, 0x00, // audio format = 1 (PCM, linear quantization)
            nChannels, 0x00, // number of channels
            sr & 255, (sr >> 8) & 255, (sr >> 16) & 255, (sr >> 24) & 255, // sample rate
            br & 255, (br >> 8) & 255, (br >> 16) & 255, (br >> 24) & 255, // byte rate
            0x04, 0x00, // block align = 4
            0x10, 0x00, // bit per sample = 16
            0x64, 0x61, 0x74, 0x61, // d a t a
            l2 & 255, (l2 >> 8) & 255, (l2 >> 16) & 255, (l2 >> 24) & 255 // sub chunk 2 size
        ])
        let buffers = [] as any
        for (let channel = 0; channel < nChannels; channel++) {
            buffers.push(audioBuffer.getChannelData(channel))
        }
        for (let i = 0, index = HEADER_LENGTH / 2; i < bufferLength; i++) {
            for (let channel = 0; channel < nChannels; channel++) {
                let sample = buffers[channel][i]
                sample = Math.min(1, Math.max(-1, sample))
                sample = Math.round(sample * MAX_AMPLITUDE)
                int16[index++] = sample
            }
        }
        let blob = new Blob([uint8], {type: "audio/x-wav"})
        return URL.createObjectURL(blob)
    }

    public static encodeMP3 = async (audioBuffer: AudioBuffer, bitrate: number = 128) => {
        let MAX_AMPLITUDE = 0x7FFF
        let nChannels = audioBuffer.numberOfChannels
        if (bitrate < 96) {
            nChannels = 1
        }
        let bufferLength = audioBuffer.length
        let buffers = [] as any

        for (let channel = 0; channel < nChannels; channel++) {
            let buffer = audioBuffer.getChannelData(channel)
            let samples = new Int16Array(bufferLength)

            for (let i = 0; i < bufferLength; ++i) {
                let sample = buffer[i]
                sample = Math.min(1, Math.max(-1, sample))
                sample = Math.round(sample * MAX_AMPLITUDE)
                samples[i] = sample
            }
            buffers.push(samples)
        }
        let BLOCK_SIZE = 1152
        let mp3encoder = new lamejs.Mp3Encoder(nChannels, 44100, bitrate);
        let mp3Data = [] as any

        let blockIndex = 0
        const encodeChunk = () => {
            let mp3buf = []
            if (nChannels === 1) {
                let chunk = buffers[0].subarray(blockIndex, blockIndex + BLOCK_SIZE)
                mp3buf = mp3encoder.encodeBuffer(chunk)
            } else {
                let chunkL = buffers[0].subarray(blockIndex, blockIndex + BLOCK_SIZE)
                let chunkR = buffers[1].subarray(blockIndex, blockIndex + BLOCK_SIZE)
                mp3buf = mp3encoder.encodeBuffer(chunkL, chunkR)
            }
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf)
            }
            blockIndex += BLOCK_SIZE
        }

        return new Promise<string>((resolve) => {
            const update = () => {
                if (blockIndex >= bufferLength) {
                    let mp3buf = mp3encoder.flush()
                    if (mp3buf.length > 0) {
                        mp3Data.push(mp3buf)
                    }
                    const blob = new Blob(mp3Data, { type: "audio/mp3"})
                    const url = URL.createObjectURL(blob)
                    resolve(url)
                }
                let start = performance.now()
                while (blockIndex < bufferLength && performance.now() - start < 15) {
                    encodeChunk()
                }
                setTimeout(update, 16.7)
            }
            update()
        })
    }

    public static encodeOGG = async (audioBuffer: AudioBuffer, coverImg?: string, metaAudio?: string) => {
        let sampleRate = audioBuffer.sampleRate
        let numberOfChannels = audioBuffer.numberOfChannels
        let quality = 0
        let tags = await Functions.getOggTags(coverImg, metaAudio)
        let encoder = new oggEncoder.encoder(sampleRate, numberOfChannels, quality, tags)
        encoder.encodeFrom(audioBuffer)
        let blob = encoder.finish()
        return URL.createObjectURL(blob)
    }

    public static encodeFLAC = async (audioBuffer: AudioBuffer) => {
        const wav = Functions.encodeWAV(audioBuffer)
        const arrayBuffer = await fetch(wav).then((r) => r.arrayBuffer())
        const encoder = new FlacEncoder(Flac, {
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels,
            bitsPerSample: 16,
            compression: 5,
            verify: true,
            isOgg: false
        })
        let encData = []
	    let result = encoder.encodeFlac(arrayBuffer, encData, true, false)
	    let metadata = result.metaData
        const blob = encoder.exportFlacFile(encData, metadata, false)
        return URL.createObjectURL(blob)
    }

    /*
    public static audioBufferSamples = (audioBuffer: AudioBuffer) => {
        const channelCount = audioBuffer.numberOfChannels
        const frameCount = audioBuffer.length
        const float32Array = new Float32Array(channelCount * frameCount)

        for (let channel = 0; channel < channelCount; channel++) {
            const channelData = audioBuffer.getChannelData(channel)
            float32Array.set(channelData, channel * frameCount)
        }
        return float32Array
    }*/
    
    public static audioBufferSamples = (audioBuffer: AudioBuffer) => {
        const numberOfChannels = audioBuffer.numberOfChannels
        const length = audioBuffer.length
        const samples = new Uint8Array(length * numberOfChannels)
      
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel)
      
          for (let i = 0; i < length; i++) {
            const sample = Math.floor((channelData[i] + 1) * 0.5 * 255)
            samples[i * numberOfChannels + channel] = sample
          }
        }
        return samples
    }

    public static getBPM = async (audioBuffer: AudioBuffer) => {
        return guess(audioBuffer)
    }

    public static createWavHeader = (numSamples: number, sampleRate: number, numChannels: number, bitsPerSample: number) => {
        const dataSize = numSamples * numChannels * (bitsPerSample / 8)
        const buffer = new ArrayBuffer(44)
        const view = new DataView(buffer)
        function writeString(offset, string) {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        }
        writeString(0, 'R')
        writeString(1, 'I')
        writeString(2, 'F')
        writeString(3, 'F')
        view.setUint32(4, dataSize + 36, true)
        writeString(8, 'W')
        writeString(9, 'A')
        writeString(10, 'V')
        writeString(11, 'E')
        writeString(12, 'f')
        writeString(13, 'm')
        writeString(14, 't')
        writeString(15, ' ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true)
        view.setUint16(22, numChannels, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true)
        view.setUint16(32, numChannels * (bitsPerSample / 8), true)
        view.setUint16(34, bitsPerSample, true)
        writeString(36, 'd')
        writeString(37, 'a')
        writeString(38, 't')
        writeString(39, 'a')
        view.setUint32(40, dataSize, true)
        return new Uint8Array(buffer)
    }
}