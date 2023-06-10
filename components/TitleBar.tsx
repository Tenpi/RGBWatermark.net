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

    const colors = ["r", "g", "b"]

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