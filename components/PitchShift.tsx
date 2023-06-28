import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import path from "path"
import {EnableDragContext, MobileContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext, AttackModeContext, AudioContext, 
AudioNameContext, AudioSpeedContext, AudioReverseContext, SourceNodeContext, SecondsProgressContext, ProgressContext, VolumeContext,
PreviousVolumeContext, PreservesPitchContext, StartTimeContext, ElapsedTimeContext, ReverseActiveContext, DurationContext, PauseContext,
SeekToContext, UpdateEffectContext, SavedTimeContext, OriginalDurationContext, patterns} from "../Context"
import functions from "../structures/Functions"
import Slider from "react-slider"
import audioReverseIcon from "../assets/icons/audio-reverse.png"
import audioSpeedIcon from "../assets/icons/audio-speed.png"
import audioClearIcon from "../assets/icons/audio-clear.png"
import audioPlayIcon from "../assets/icons/audio-play.png"
import audioPauseIcon from "../assets/icons/audio-pause.png"
import audioRewindIcon from "../assets/icons/audio-rewind.png"
import audioFastforwardIcon from "../assets/icons/audio-fastforward.png"
import audioPreservePitchIcon from "../assets/icons/audio-preservepitch.png"
import audioPreservePitchOnIcon from "../assets/icons/audio-preservepitch-on.png"
import audioFullscreenIcon from "../assets/icons/audio-fullscreen.png"
import audioVolumeIcon from "../assets/icons/audio-volume.png"
import audioVolumeLowIcon from "../assets/icons/audio-volume-low.png"
import audioVolumeMuteIcon from "../assets/icons/audio-volume-mute.png"
import fileType from "magic-bytes.js"
import uploadIcon from "../assets/icons/upload.png"
import xIcon from "../assets/icons/x.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import audioPlaceholder from "../assets/images/audio-placeholder.png"
// @ts-ignore
import {createScheduledSoundTouchNode} from "@dancecuts/soundtouchjs-scheduled-audio-worklet"
import "./styles/bitcrush.less"

interface Props {
    audioContext: AudioContext
}

let pitchShifterNode = null as any
let pitchCorrectNode = null as any
let gainNode = null as any

const PitchShift: React.FunctionComponent<Props> = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {audio, setAudio} = useContext(AudioContext)
    const {audioName, setAudioName} = useContext(AudioNameContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {attackMode, setAttackMode} = useContext(AttackModeContext)
    const [pitchShift, setPitchShift] = useState(1)
    const [audioRate, setAudioRate] = useState(1)
    const [lfoMode, setLFOMode] = useState(false)
    const [lfoRate, setLFORate] = useState(0)
    const {sourceNode, setSourceNode} = useContext(SourceNodeContext)
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const [showSpeedSlider, setShowSpeedSlider] = useState(false)
    const coverRef = useRef<HTMLCanvasElement>(null)
    const audioControls = useRef<HTMLDivElement>(null)
    const audioSliderRef = useRef<any>(null)
    const audioSpeedRef = useRef(null) as any
    const audioVolumeRef = useRef(null) as any
    const audioVolumeSliderRef = useRef<any>(null)
    const audioSpeedSliderRef = useRef<any>(null)
    const {secondsProgress, setSecondsProgress} = useContext(SecondsProgressContext)
    const {progress, setProgress} = useContext(ProgressContext)
    const [dragProgress, setDragProgress] = useState(0) as any
    const {audioReverse, setAudioReverse} = useContext(AudioReverseContext)
    const {audioSpeed, setAudioSpeed} = useContext(AudioSpeedContext)
    const {volume, setVolume} = useContext(VolumeContext)
    const {previousVolume, setPreviousVolume} = useContext(PreviousVolumeContext)
    const {paused, setPaused} = useContext(PauseContext)
    const {preservesPitch, setPreservesPitch} = useContext(PreservesPitchContext)
    const {duration, setDuration} = useContext(DurationContext)
    const {originalDuration, setOriginalDuration} = useContext(OriginalDurationContext)
    const [dragging, setDragging] = useState(false)
    const [coverImg, setCoverImg] = useState(null) as any
    const {startTime, setStartTime} = useContext(StartTimeContext)
    const {elapsedTime, setElapsedTime} = useContext(ElapsedTimeContext)
    const {seekTo, setSeekTo} = useContext(SeekToContext)
    const {updateEffect, setUpdateEffect} = useContext(UpdateEffectContext)
    const {reverseActive, setReverseActive} = useContext(ReverseActiveContext)
    const {savedTime, setSavedTime} = useContext(SavedTimeContext)
    const history = useHistory()
    
    const audioContext = props.audioContext

    useEffect(() => {
        if (audioSliderRef.current) audioSliderRef.current.resize()
        if (audioSpeedSliderRef.current) audioSpeedSliderRef.current.resize()
        if (audioVolumeSliderRef.current) audioVolumeSliderRef.current.resize()
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

    const getCurrentTime = () => {
        let currentTime = 0
        if (pitchShifterNode && pitchShifterNode.playbackState === pitchShifterNode.PLAYING_STATE) {
          currentTime = elapsedTime + audioContext.currentTime - startTime
        } else {
          currentTime = elapsedTime
        }
        while (currentTime > duration) currentTime -= duration
        return currentTime
    }

    useEffect(() => {
        let timeout = null as any
        const updatePosition = async () => {
            let currentTime = getCurrentTime()
            let percent = (currentTime / duration)
            if (!Number.isFinite(percent)) return
            if (!dragging) {
                if (audioReverse) {
                    setProgress((1-percent) * 100)
                    setSecondsProgress(duration - currentTime)
                } else {
                    setProgress(percent * 100)
                    setSecondsProgress(currentTime)
                }
            }
            setSavedTime(currentTime)
            await new Promise<void>((resolve) => {
                clearTimeout(timeout)
                timeout = setTimeout(() => {
                    resolve()
                }, 1000)
            }).then(updatePosition)
        }
        updatePosition()
        return () => {
            clearTimeout(timeout)
        }
    }, [sourceNode, duration, dragging, audioReverse, startTime, elapsedTime])

    const loadAudio = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0]
                const wav = result?.mime === "audio/x-wav"
                const mp3 = result?.mime === "audio/mpeg"
                const ogg = result?.mime === "audio/ogg"
                const aiff = result?.mime === "audio/x-aiff"
                if (wav || mp3 || ogg || aiff) {
                    const blob = new Blob([bytes])
                    const url = URL.createObjectURL(blob)
                    const link = `${url}#.${result.typename}`
                    setAudio(link)
                    setAudioName(file.name.slice(0, 30))
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const renderLFO = async (normalBuffer: AudioBuffer, effectBuffer: AudioBuffer) => {
        const normalWAV = functions.encodeWAV(normalBuffer)
        const effectWAV = functions.encodeWAV(effectBuffer)
        const normalArrayBuffer = await fetch(normalWAV).then((r) => r.arrayBuffer())
        const effectArrayBuffer = await fetch(effectWAV).then((r) => r.arrayBuffer())
        const normalArray = new Uint8Array(normalArrayBuffer)
        const effectArray = new Uint8Array(effectArrayBuffer)
        const header = normalArray.slice(0, 44)
        const normalSamples = normalArray.slice(44)
        const effectSamples = effectArray.slice(44)
        const {bpm} = await functions.getBPM(normalBuffer)
        const blockSize = Math.round(Math.ceil(60/bpm * normalBuffer.sampleRate) * ((2**lfoRate)/2))
        let normalBlocks = [] as any
        for (let i = 0; i < normalSamples.length; i+=blockSize) {
            let block = [] as any
            for (let j = i; j < i + blockSize; j++) {
                block.push(normalSamples[j])
            }
            normalBlocks.push(block)
        }
        let effectBlocks = [] as any
        for (let i = 0; i < effectSamples.length; i+=blockSize) {
            let block = [] as any
            for (let j = i; j < i + blockSize; j++) {
                block.push(effectSamples[j])
            }
            effectBlocks.push(block)
        }
        let blockArray = [] as any
        for (let i = 0; i < normalBlocks.length + effectBlocks.length; i+=2) {
            blockArray.push(normalBlocks[i])
            blockArray.push(effectBlocks[i+1])
        }
        blockArray = blockArray.flat(Infinity)
        const array = [...header, ...blockArray]
        const blob = new Blob([new Uint8Array(array)])
        const url = URL.createObjectURL(blob)
        const arrayBuffer = await fetch((url)).then((r) => r.arrayBuffer())
        return audioContext.decodeAudioData(arrayBuffer)
    }

    const applyPitchShift = async () => {
        if (!audio) return
        stop()
        const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        let audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        if (lfoMode) {
            const original = await renderOriginal()
            const effect = await render()
            const rendered = await renderLFO(original, effect)
            setDuration(rendered.duration / audioSpeed)
            setOriginalDuration(rendered.duration)
            gainNode = audioContext.createGain()
            gainNode.gain.value = volume 
            await audioContext.audioWorklet.addModule("./phase-vocoder.js")
            pitchCorrectNode = new AudioWorkletNode(audioContext, "phase-vocoder-processor")
            await audioContext.audioWorklet.addModule("./soundtouch.js")
            pitchShifterNode = createScheduledSoundTouchNode(audioContext, rendered)
            pitchShifterNode.loop = true
            await functions.timeout(100)
            pitchShifterNode.connect(pitchCorrectNode)
            pitchCorrectNode.connect(gainNode)
            gainNode.connect(audioContext.destination)
            pitchShifterNode.start()
            //setSourceNode(pitchShifterNode)
            setStartTime(audioContext.currentTime)
            audioContext.resume()
            setPaused(false)
        } else {
            if (audioReverse) audioBuffer = functions.reverseAudioBuffer(audioBuffer)
            setDuration(audioBuffer.duration / audioSpeed)
            setOriginalDuration(audioBuffer.duration)
            await audioContext.audioWorklet.addModule("./phase-vocoder.js")
            pitchCorrectNode = new AudioWorkletNode(audioContext, "phase-vocoder-processor")
            pitchCorrectNode.parameters.get("pitchFactor").value = preservesPitch ? 1 / audioSpeed : 1
            gainNode = audioContext.createGain()
            gainNode.gain.value = volume
            await audioContext.audioWorklet.addModule("./soundtouch.js")
            pitchShifterNode = createScheduledSoundTouchNode(audioContext, audioBuffer)
            pitchShifterNode.loop = true
            pitchShifterNode.parameters.get("pitch").value = pitchShift
            pitchShifterNode.parameters.get("tempo").value = audioRate
            pitchShifterNode.parameters.get("rate").value = audioSpeed
            await functions.timeout(100)
            pitchShifterNode.connect(pitchCorrectNode)
            pitchCorrectNode.connect(gainNode)
            gainNode.connect(audioContext.destination)
            pitchShifterNode.start()
            //setSourceNode(pitchShifterNode)
            setStartTime(audioContext.currentTime)
            audioContext.resume()
            setPaused(false)
        }
    }

    const updateSongCover = async () => {
        try {
            const songCover = await functions.songCover(audio)
            setCoverImg(songCover)
        } catch {
            setCoverImg("")
        }
    }

    useEffect(() => {
        applyPitchShift()
        updateSongCover()
    }, [audio])

    useEffect(() => {
        if (pitchShifterNode) {
            pitchShifterNode.parameters.get("pitch").value = pitchShift
            pitchShifterNode.parameters.get("tempo").value = audioRate
            pitchShifterNode.parameters.get("rate").value = audioSpeed
        }
        if (pitchCorrectNode) {
            pitchCorrectNode.parameters.get("pitchFactor").value = preservesPitch ? 1 / audioSpeed : 1
        }
    }, [pitchShift, audioRate, audioSpeed, preservesPitch])

    useEffect(() => {
        if (updateEffect) {
            applyPitchShift()
            setUpdateEffect(false)
        }
    }, [sourceNode, pitchShift, audioRate, startTime, elapsedTime, duration, audioReverse, audioSpeed, preservesPitch, updateEffect, lfoMode, lfoRate])

    useEffect(() => {
        if (gainNode) {
            gainNode.gain.value = functions.logSlider(volume)
        }
    }, [volume])

    const removeAudio = () => {
        setAudio("")
        setAudioName("")
        stop()
    }

    const reset = () => {
        setPitchShift(1)
        setAudioRate(1)
        setLFORate(0)
        setLFOMode(false)
    }

    useEffect(() => {
        const savedPitchShift = localStorage.getItem("pitchShift")
        if (savedPitchShift) setPitchShift(Number(savedPitchShift))
        const savedAudioRate = localStorage.getItem("audioRate")
        if (savedAudioRate) setAudioRate(Number(savedAudioRate))
        const savedPitchShiftLFORate = localStorage.getItem("pitchShiftLFORate")
        if (savedPitchShiftLFORate) setLFORate(Number(savedPitchShiftLFORate))
        const savedPitchShiftLFOMode = localStorage.getItem("pitchShiftLFOMode")
        if (savedPitchShiftLFOMode) setLFOMode(savedPitchShiftLFOMode === "true")
        const savedVolume = localStorage.getItem("volume")
        if (savedVolume) setVolume(Number(savedVolume))
        const savedPreviousVolume = localStorage.getItem("previousVolume")
        if (savedPreviousVolume) setPreviousVolume(Number(savedPreviousVolume))
        const savedPreservesPitch = localStorage.getItem("preservesPitch")
        if (savedPreservesPitch) setPreservesPitch(Number(savedPreservesPitch))
        setTimeout(() => {
            setUpdateEffect(true)
            setTimeout(() => {
                setSeekTo(savedTime)
            }, 300)
        }, 400)
    }, [])

    useEffect(() => {
        localStorage.setItem("pitchShift", String(pitchShift))
        localStorage.setItem("audioRate", String(audioRate))
        localStorage.setItem("pitchShiftLFORate", String(lfoRate))
        localStorage.setItem("pitchShiftLFOMode", String(lfoMode))
        localStorage.setItem("volume", String(volume))
        localStorage.setItem("previousVolume", String(volume))
        localStorage.setItem("preservesPitch", String(preservesPitch))
    }, [volume, previousVolume, preservesPitch, pitchShift, audioRate, lfoRate, lfoMode])

    const renderOriginal = async () => {
        const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        let audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        if (audioReverse) audioBuffer = functions.reverseAudioBuffer(audioBuffer)
        const offlineContext = new OfflineAudioContext({
            numberOfChannels: audioBuffer.numberOfChannels, 
            length: audioBuffer.length / audioSpeed, 
            sampleRate: audioBuffer.sampleRate
        })
        await offlineContext.audioWorklet.addModule("./phase-vocoder.js")
        const pitchCorrectNode = new AudioWorkletNode(offlineContext, "phase-vocoder-processor") as any
        const gainNode = offlineContext.createGain()
        gainNode.gain.value = 1 //volume
        await offlineContext.audioWorklet.addModule("./soundtouch.js")
        const pitchShifterNode = createScheduledSoundTouchNode(offlineContext, audioBuffer)
        pitchShifterNode.loop = true
        await functions.timeout(100)
        pitchShifterNode.connect(pitchCorrectNode)
        pitchCorrectNode.connect(gainNode)
        gainNode.connect(offlineContext.destination)
        pitchShifterNode.start()
        let rendered = null as unknown as AudioBuffer
        rendered = await offlineContext.startRendering()
        return rendered
    }

    const renderEffect = async () => {
        const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
        let audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        if (audioReverse) audioBuffer = functions.reverseAudioBuffer(audioBuffer)
        const offlineContext = new OfflineAudioContext({
            numberOfChannels: audioBuffer.numberOfChannels, 
            length: audioBuffer.length / audioSpeed, 
            sampleRate: audioBuffer.sampleRate
        })
        await offlineContext.audioWorklet.addModule("./phase-vocoder.js")
        const pitchCorrectNode = new AudioWorkletNode(offlineContext, "phase-vocoder-processor") as any
        pitchCorrectNode.parameters.get("pitchFactor").value = preservesPitch ? 1 / audioSpeed : 1
        const gainNode = offlineContext.createGain()
        gainNode.gain.value = 1 //volume
        await offlineContext.audioWorklet.addModule("./soundtouch.js")
        const pitchShifterNode = createScheduledSoundTouchNode(offlineContext, audioBuffer)
        pitchShifterNode.loop = true
        pitchShifterNode.parameters.get("pitch").value = pitchShift
        pitchShifterNode.parameters.get("tempo").value = audioRate
        pitchShifterNode.parameters.get("rate").value = audioSpeed
        await functions.timeout(100)
        pitchShifterNode.connect(pitchCorrectNode)
        pitchCorrectNode.connect(gainNode)
        gainNode.connect(offlineContext.destination)
        pitchShifterNode.start()
        let rendered = null as unknown as AudioBuffer
        rendered = await offlineContext.startRendering()
        return rendered
    }

    const render = async () => {
        if (lfoMode) {
            const arrayBuffer = await fetch(audio).then((r) => r.arrayBuffer())
            let audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
            const original = await renderOriginal()
            const effect = await renderEffect()
            return renderLFO(original, effect)
        } else {
            return renderEffect()
        }
    }

    const mp3 = async () => {
        const audioBuffer = await render()
        const wav = functions.encodeWAV(audioBuffer)
        let mp3 = await functions.convertToMP3(wav)
        if (coverImg) mp3 = await functions.writeSongCover(mp3, coverImg, audio)
        functions.download(`${path.basename(audioName, path.extname(audioName))}_pitchshift.mp3`, mp3)
    }

    const wav = async () => {
        const audioBuffer = await render()
        const wav = functions.encodeWAV(audioBuffer)
        functions.download(`${path.basename(audioName, path.extname(audioName))}_pitchshift.wav`, wav)
    }

    const ogg = async () => {
        const audioBuffer = await render()
        const ogg = await functions.encodeOGG(audioBuffer, coverImg, audio)
        functions.download(`${path.basename(audioName, path.extname(audioName))}_pitchshift.ogg`, ogg)
    }

    const flac = async () => {
        const audioBuffer = await render()
        const flac = await functions.encodeFLAC(audioBuffer)
        functions.download(`${path.basename(audioName, path.extname(audioName))}_pitchshift.flac`, flac)
    }

    useEffect(() => {
        if (!dragging && dragProgress !== null) {
            setSecondsProgress(dragProgress)
            setProgress((dragProgress / duration) * 100)
            setDragProgress(null)
        }
    }, [dragging, dragProgress, duration])

    const getPreservePitchIcon = () => {
        if (preservesPitch) return audioPreservePitchIcon
        return audioPreservePitchOnIcon
    }

    const getAudioSpeedMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = 4
        return `${raw + offset}px`
    }

    const getAudioVolumeMarginRight = () => {
        const controlRect = audioControls.current?.getBoundingClientRect()
        const rect = audioVolumeRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -7
        return `${raw + offset}px`
    }

    const updateProgressText = (value: number) => {
        let percent = value / 100
        if (audioReverse === true) {
            const secondsProgress = (1-percent) * duration
            setDragProgress(duration - secondsProgress)
        } else {
            const secondsProgress = percent * duration
            setDragProgress(secondsProgress)
        }
    }

    useEffect(() => {
        if (seekTo !== null) {
            let progress = (100 / duration) * seekTo
            if (audioReverse) progress = 100 - progress
            start(seekTo)
            setProgress(progress)
            setSecondsProgress(seekTo)
            setSeekTo(null)
        }
    }, [seekTo, audioReverse, pitchShift, audioRate, audioSpeed, reverseActive, elapsedTime, startTime, duration])

    const updatePlay = async (alwaysPlay?: boolean) => {
        if (paused || alwaysPlay) {
            audioContext.resume()
            setPaused(false)
        } else {
            audioContext.suspend()
            setPaused(true)
        }
    }

    const start = async (offset: number) => {
        if (!pitchShifterNode) return
        pitchShifterNode.stop()
        pitchShifterNode.disconnect()
        let audioBuffer = pitchShifterNode.audioBuffer
        if (audioReverse && !reverseActive) {
            audioBuffer = functions.reverseAudioBuffer(audioBuffer)
            setReverseActive(true)
        } else if (!audioReverse && reverseActive) {
            audioBuffer = functions.reverseAudioBuffer(audioBuffer)
            setReverseActive(false)
        }
        pitchShifterNode = createScheduledSoundTouchNode(audioContext, audioBuffer)
        pitchShifterNode.parameters.get("pitch").value = pitchShift
        pitchShifterNode.parameters.get("tempo").value = audioRate
        pitchShifterNode.parameters.get("rate").value = audioSpeed
        await functions.timeout(100)
        pitchShifterNode.loop = true
        pitchShifterNode.connect(pitchCorrectNode)
        pitchShifterNode.start(0, offset)
        //setSourceNode(pitchShifterNode)
        setStartTime(audioContext.currentTime)
        setElapsedTime(offset)
        audioContext.resume()
    }

    const stop = () => {
        if (!pitchShifterNode) return
        pitchShifterNode?.stop()
        pitchShifterNode?.disconnect()
        audioContext.suspend()
        setStartTime(audioContext.currentTime)
        setElapsedTime(0)
        setProgress(0)
        setSecondsProgress(0)
        //setSourceNode(null)
    }

    const updateMute = () => {
        if (volume > 0) {
            setVolume(0)
        } else {
            const newVol = previousVolume ? previousVolume : 1
            setVolume(newVol)
        }
        setShowVolumeSlider((prev) => !prev)
    }

    const updateVolume = (value: number) => {
        if (value > 1) value = 1
        if (value < 0) value = 0
        if (Number.isNaN(value)) value = 0
        setVolume(value)
        setPreviousVolume(value)
    }

    const rewind = (value?: number) => {
        if (!value) value = Math.floor(duration / 10)
        const current = getCurrentTime()
        let seconds = current - value
        if (audioReverse) seconds = current + value
        if (seconds < 0) seconds = 0
        if (seconds > duration) seconds = duration
        setSeekTo(seconds)
    }

    const fastforward = (value?: number) => {
        if (!value) value = Math.floor(duration / 10)
        const current = getCurrentTime()
        let seconds = current + value
        if (audioReverse) seconds = current - value
        if (seconds < 0) seconds = 0
        if (seconds > duration) seconds = duration
        setSeekTo(seconds)
    }

    const seek = (position: number) => {
        let secondsProgress = audioReverse ? ((100 - position) / 100) * duration : (position / 100) * duration
        let progress = audioReverse ? 100 - position : position
        setProgress(progress)
        setDragging(false)
        setSeekTo(secondsProgress)
    }

    const changeReverse = (value?: boolean) => {
        const val = value !== undefined ? value : !audioReverse 
        let secondsProgress = val === true ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        setAudioReverse(val)
        setSeekTo(secondsProgress)
    }

    const updateSpeed = (speed: number) => {
        setAudioSpeed(speed)
        let secondsProgress = audioReverse ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        setDuration(originalDuration / speed)
        //setSeekTo(secondsProgress / speed)
    }

    const changePreservesPitch = (value?: boolean) => {
        const val = value !== undefined ? value : !preservesPitch
        setPreservesPitch(val)
    }

    const getAudioPlayIcon = () => {
        if (paused) return audioPlayIcon
        return audioPauseIcon
    }

    const getAudioVolumeIcon = () => {
        if (volume > 0.5) {
            return audioVolumeIcon
        } else if (volume > 0) {
            return audioVolumeLowIcon
        } else {
            return audioVolumeMuteIcon
        }
    }

    const audioReset = () => {
        changeReverse(false)
        changePreservesPitch(false)
        setAudioSpeed(1)
        setPaused(false)
        setShowSpeedDropdown(false)
        updatePlay(true)
        setSeekTo(0)
    }

    const loadImage = async () => {
        if (!coverRef.current) return
        let src = coverImg ? coverImg : audioPlaceholder
        const img = document.createElement("img")
        img.src = src 
        img.onload = () => {
            if (!coverRef.current) return
            const refCtx = coverRef.current.getContext("2d")
            coverRef.current.width = img.width
            coverRef.current.height = img.height
            refCtx?.drawImage(img, 0, 0, img.width, img.height)
        }
    }

    useEffect(() => {
        loadImage()
    }, [coverImg])

    const getLFORate = () => {
        if (lfoRate === 5) return "1/1"
        if (lfoRate === 4) return "1/2"
        if (lfoRate === 3) return "1/4"
        if (lfoRate === 2) return "1/8"
        if (lfoRate === 1) return "1/16"
        if (lfoRate === 0) return "1/32"
    }

    const updateLFOMode = () => {
        setLFOMode((prev) => !prev)
        setUpdateEffect(true)
    }

    return (
        <div className="bitcrush-image-component" onMouseEnter={() => setEnableDrag(true)}>
            <div className="bitcrush-upload-container">
                <div className="bitcrush-row">
                    <span className="bitcrush-text">Audio:</span>
                </div>
                <div className="bitcrush-row">
                    <label htmlFor="img" className="bitcrush-button" style={{width: "119px"}}>
                        <span className="button-hover">
                            <span className="button-text">Upload</span>
                            <img className="button-image" src={uploadIcon}/>
                        </span>
                    </label>
                    <input id="img" type="file" onChange={(event) => loadAudio(event)}/>
                    {audio ? 
                        <div className="button-image-name-container">
                            <img className="button-image-icon" src={xIcon} style={{filter: getFilter()}} onClick={removeAudio}/>
                            <span className="button-image-name">{audioName}</span>
                        </div>
                    : null}
                </div>
            </div>
            <div className="relative-ref">
                <canvas className="bitcrush-cover" ref={coverRef}></canvas>
                <div className="audio-controls" ref={audioControls} onMouseUp={() => setDragging(false)}>
                    <div className="audio-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)} style={{filter: getFilter2()}}>
                        <p className="audio-control-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                        <Slider ref={audioSliderRef} className="audio-slider" trackClassName="audio-slider-track" thumbClassName="audio-slider-thumb" min={0} max={100} value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(value)}/>
                        <p className="audio-control-text">{functions.formatSeconds(duration)}</p>
                    </div>
                    <div className="audio-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="audio-control-row-container">
                            <img className="audio-control-img" onClick={() => changeReverse()} src={audioReverseIcon} style={{filter: getFilter2()}}/>
                            <img className="audio-control-img" ref={audioSpeedRef} src={audioSpeedIcon} onMouseEnter={() => setShowSpeedSlider(true)} onMouseLeave={() => setShowSpeedSlider(false)} onClick={() => setShowSpeedSlider((prev: boolean) => !prev)} style={{filter: getFilter2()}}/>
                        </div>
                        <div className="audio-ontrol-row-container">
                            <img className="audio-control-img" src={audioRewindIcon} onClick={() => rewind()} style={{filter: getFilter2()}}/>
                            <img className="audio-control-img" onClick={() => updatePlay()} src={getAudioPlayIcon()} style={{filter: getFilter2()}}/>
                            <img className="audio-control-img" src={audioFastforwardIcon} onClick={() => fastforward()} style={{filter: getFilter2()}}/>
                        </div>    
                        <div className="audio-control-row-container">
                            <img className="audio-control-img" onClick={() => changePreservesPitch()} src={getPreservePitchIcon()} style={{filter: getFilter2()}}/>
                            <img className="audio-control-img" src={audioClearIcon} onClick={audioReset} style={{filter: getFilter2()}}/>
                        </div>
                        <div className="audio-control-row-container" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
                            <img className="audio-control-img" ref={audioVolumeRef} src={getAudioVolumeIcon()} onClick={updateMute} style={{filter: getFilter2()}}/>
                        </div>
                    </div>
                    <div className={`audio-speed-dropdown ${showSpeedSlider ? "" : "hide-speed-dropdown"}`} style={{marginRight: getAudioSpeedMarginRight(), marginTop: "-95px"}}
                    onMouseEnter={() => {setShowSpeedSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowSpeedSlider(false); setEnableDrag(true)}}>
                        <Slider ref={audioSpeedSliderRef} invert orientation="vertical" className="audio-speed-slider" trackClassName="audio-speed-slider-track" thumbClassName="audio-speed-slider-thumb"
                        value={audioSpeed} min={0.5} max={2} step={0.1} onChange={(value) => updateSpeed(value)}/>
                    </div>
                    <div className={`audio-volume-dropdown ${showVolumeSlider ? "" : "hide-volume-dropdown"}`} style={{marginRight: getAudioVolumeMarginRight(), marginTop: "-110px"}}
                    onMouseEnter={() => {setShowVolumeSlider(true); setEnableDrag(false)}} onMouseLeave={() => {setShowVolumeSlider(false); setEnableDrag(true)}}>
                        <Slider ref={audioVolumeSliderRef} invert orientation="vertical" className="audio-volume-slider" trackClassName="audio-volume-slider-track" thumbClassName="audio-volume-slider-thumb"
                        value={volume} min={0} max={1} step={0.05} onChange={(value) => updateVolume(value)}/>
                    </div>
                </div>
            </div>
            <div className="bitcrush-options-container">
                <div className="bitcrush-row">
                    <span className="bitcrush-text-mini" style={{width: "auto", fontSize: "20px"}}>LFO?</span>
                    <img className="bitcrush-checkbox" src={lfoMode ? checkboxChecked : checkbox} onClick={() => updateLFOMode()} style={{marginLeft: "5px", filter: getFilter()}}/>
                </div>
                <div className="bitcrush-row">
                    <span className="bitcrush-text">LFO Rate: </span>
                    <Slider className="bitcrush-slider" trackClassName="bitcrush-slider-track" thumbClassName="bitcrush-slider-thumb" onChange={(value) => setLFORate(value)} min={0} max={5} step={1} value={lfoRate} onAfterChange={() => lfoMode ? setUpdateEffect(true) : null}/>
                    <span className="bitcrush-text-mini">{getLFORate()}</span>
                </div>
                <div className="bitcrush-row">
                    <span className="bitcrush-text">Pitch Shift: </span>
                    <Slider className="bitcrush-slider" trackClassName="bitcrush-slider-track" thumbClassName="bitcrush-slider-thumb" onChange={(value) => setPitchShift(value)} min={0.5} max={2} step={0.05} value={pitchShift}/>
                    <span className="bitcrush-text-mini">{pitchShift}</span>
                </div>
                <div className="bitcrush-row">
                    <span className="bitcrush-text">Audio Rate: </span>
                    <Slider className="bitcrush-slider" trackClassName="bitcrush-slider-track" thumbClassName="bitcrush-slider-thumb" onChange={(value) => setAudioRate(value)} min={0.5} max={2} step={0.05} value={audioRate}/>
                    <span className="bitcrush-text-mini">{audioRate}</span>
                </div>
            </div>
            {audio ?
            <div className="bitcrush-image-container">
                <div className="bitcrush-image-buttons-container">
                    <button className="bitcrush-image-button" onClick={mp3}>MP3</button>
                    <button className="bitcrush-image-button" onClick={wav}>WAV</button>
                    <button className="bitcrush-image-button" onClick={ogg}>OGG</button>
                    <button className="bitcrush-image-button" onClick={flac}>FLAC</button>
                </div>
            </div> : null}
            <div className="bitcrush-options-container">
                <div className="bitcrush-row">
                    <button className="bitcrush-button" onClick={reset} style={{padding: "0px 5px", marginTop: "7px"}}>
                        <span className="button-hover">
                            <span className="button-text">Reset</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PitchShift