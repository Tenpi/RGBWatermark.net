import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import {EnableDragContext, MobileContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext, StopAnimationContext, ImageContext} from "../Context"
import functions from "../structures/Functions"
import Slider from "react-slider"
import color from "../assets/icons/color2.png"
import placeholder from "../assets/images/placeholder.png"
import "./styles/titlebar.less"

import frame1 from "../assets/icons/logo/logo 1.png"
import frame2 from "../assets/icons/logo/logo 2.png"
import frame3 from "../assets/icons/logo/logo 3.png"
import frame4 from "../assets/icons/logo/logo 4.png"
import frame5 from "../assets/icons/logo/logo 5.png"
import frame6 from "../assets/icons/logo/logo 6.png"
import frame7 from "../assets/icons/logo/logo 7.png"
import frame8 from "../assets/icons/logo/logo 8.png"
import frame9 from "../assets/icons/logo/logo 9.png"
import frame10 from "../assets/icons/logo/logo 10.png"
import frame11 from "../assets/icons/logo/logo 11.png"
import frame12 from "../assets/icons/logo/logo 12.png"
import frame13 from "../assets/icons/logo/logo 13.png"
import frame14 from "../assets/icons/logo/logo 14.png"
import frame15 from "../assets/icons/logo/logo 15.png"
import frame16 from "../assets/icons/logo/logo 16.png"
import frame17 from "../assets/icons/logo/logo 17.png"
import frame18 from "../assets/icons/logo/logo 18.png"
import frame19 from "../assets/icons/logo/logo 19.png"
import frame20 from "../assets/icons/logo/logo 20.png"
import frame21 from "../assets/icons/logo/logo 21.png"
import frame22 from "../assets/icons/logo/logo 22.png"
import frame23 from "../assets/icons/logo/logo 23.png"
import frame24 from "../assets/icons/logo/logo 24.png"

const frames = [frame1, frame2, frame3, frame4, frame5, frame6, frame7, 
frame8, frame9, frame10, frame11, frame12, frame13, frame14, frame15, 
frame16, frame17, frame18, frame19, frame20, frame21, frame22, frame23, frame24]

const colorList = {
    "--selection": "rgba(168, 203, 255, 0.302)",
    "--text": "#1a73ff",
    "--buttonBG": "#177cff",
    "--background": "#0f142a",
    "--titlebarBG": "#161b47",
    "--sliderBG": "#030e1f",
    "--inputBG": "#092655",
    "--patternBorder": "#153fdd",
    "--patternBorder2": "#dd34a5"
}

interface Props {
    rerender: () => void
}

let pos = 0

const TitleBar: React.FunctionComponent<Props> = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {stopAnimations, setStopAnimations} = useContext(StopAnimationContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [activeDropdown, setActiveDropdown] = useState(false)
    const {image, setImage} = useContext(ImageContext)
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()
    const [colorPos, setColorPos] =  useState(0)

    const titleClick = () => {
        history.push("/")
    }

    useEffect(() => {
        if (!image) setImage(placeholder)
    }, [image])

    useEffect(() => {
        const savedHue = localStorage.getItem("siteHue")
        const savedSaturation = localStorage.getItem("siteSaturation")
        const savedLightness = localStorage.getItem("siteLightness")
        if (savedHue) setSiteHue(Number(savedHue))
        if (savedSaturation) setSiteSaturation(Number(savedSaturation))
        if (savedLightness) setSiteLightness(Number(savedLightness))
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        for (let i = 0; i < Object.keys(colorList).length; i++) {
            const key = Object.keys(colorList)[i]
            const color = Object.values(colorList)[i]
            document.documentElement.style.setProperty(key, functions.rotateColor(color, siteHue, siteSaturation, siteLightness))
        }
        setTimeout(() => {
            props.rerender()
        }, 100)
        localStorage.setItem("siteHue", siteHue)
        localStorage.setItem("siteSaturation", siteSaturation)
        localStorage.setItem("siteLightness", siteLightness)
    }, [siteHue, siteSaturation, siteLightness])

    const resetFilters = () => {
        setSiteHue(189)
        setSiteSaturation(100)
        setSiteLightness(50)
        setTimeout(() => {
            props.rerender()
        }, 100)
    }

    const getFilter = () => {
        if (typeof window === "undefined") return
        const bodyStyles = window.getComputedStyle(document.body)
        const color = bodyStyles.getPropertyValue("--text")
        return functions.calculateFilter(color)
    }

    const draw = (pos: number) => {
        const imgElement = document.createElement("img")
        imgElement.src = frames[pos]
        imgElement.onload = () => {
            if (!ref.current) return
            ref.current.width = imgElement.width
            ref.current.height = imgElement.height
            const refCtx = ref.current.getContext("2d")!
            refCtx.clearRect(0, 0, ref.current.width, ref.current.height)
            refCtx?.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height)
        }
    }

    const colors = ["r", "g", "b"]

    /*
    useEffect(() => {
        let timeout = null as any
        const animationLoop = async () => {
            if (stopAnimations) return
            let newPos = colorPos + 1
            if (newPos > colors.length - 1) {
                newPos = 0
            }
            await new Promise<void>((resolve) => {
                clearTimeout(timeout)
                timeout = setTimeout(() => {
                    setColorPos(newPos)
                    resolve()
                }, 2000)
            }).then(animationLoop)
        }
        animationLoop()
        return () => {
            clearTimeout(timeout)
        }
    }, [stopAnimations, colorPos])*/

    /*
    useEffect(() => {
        let timeout = null as any
        const animationLoop = async () => {
            draw(pos)
            if (stopAnimations) return
            pos += 1
            if (pos > frames.length - 1) {
                pos = 0
            }
            await new Promise<void>((resolve) => {
                clearTimeout(timeout)
                timeout = setTimeout(() => {
                    resolve()
                }, 100)
            }).then(animationLoop)
        }
        animationLoop()
        return () => {
            clearTimeout(timeout)
        }
    }, [stopAnimations])*/

    const generateTitleJSX = () => {
        let colorPos1 = colorPos
        if (colorPos1 > colors.length - 1) {
            colorPos1 = 0
        }
        let colorPos2 = colorPos1 + 1
        if (colorPos2 > colors.length - 1) {
            colorPos2 = 0
        }
        let colorPos3 = colorPos2 + 1
        if (colorPos3 > colors.length - 1) {
            colorPos3 = 0
        }
        let jsx = [] as any
        jsx.push(<>
            <span className={`titlebar-text color-${colors[colorPos1]}`}>R</span>
            <span className={`titlebar-text color-${colors[colorPos2]}`}>G</span>
            <span className={`titlebar-text color-${colors[colorPos3]}`}>B</span>
            <span className={`titlebar-text color-${colors[colorPos1]}`}>W</span>
            <span className={`titlebar-text color-${colors[colorPos2]}`}>a</span>
            <span className={`titlebar-text color-${colors[colorPos3]}`}>t</span>
            <span className={`titlebar-text color-${colors[colorPos1]}`}>e</span>
            <span className={`titlebar-text color-${colors[colorPos2]}`}>r</span>
            <span className={`titlebar-text color-${colors[colorPos3]}`}>m</span>
            <span className={`titlebar-text color-${colors[colorPos1]}`}>a</span>
            <span className={`titlebar-text color-${colors[colorPos2]}`}>r</span>
            <span className={`titlebar-text color-${colors[colorPos3]}`}>k</span>
            </>
        )
        return jsx
    }

    return (
        <div className={`titlebar`} onMouseEnter={() => setEnableDrag(false)}>
            <div className="titlebar-logo-container" onClick={titleClick}>
                <span className="titlebar-hover">
                    <div className="titlebar-text-container">
                        {/* <canvas className="titlebar-img" ref={ref}></canvas> */}
                        {generateTitleJSX()}
                    </div>
                </span>
            </div>
            <div className="titlebar-container">
                <div className="titlebar-color-container">
                    <img className="titlebar-color-icon" src={color} style={{filter: getFilter()}} onClick={() => setActiveDropdown((prev) => !prev)}/>
                </div>
            </div>
            <div className={`title-dropdown ${activeDropdown ? "" : "hide-title-dropdown"}`}>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">Hue</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setSiteHue(value)} min={60} max={300} step={1} value={siteHue}/>
                </div>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">Saturation</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setSiteSaturation(value)} min={50} max={100} step={1} value={siteSaturation}/>
                </div>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">Lightness</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setSiteLightness(value)} min={45} max={55} step={1} value={siteLightness}/>
                </div>
                <div className="title-dropdown-row">
                    <button className="title-dropdown-button" onClick={() => resetFilters()}>Reset</button>
                </div>
            </div>
        </div>
    )
}

export default TitleBar