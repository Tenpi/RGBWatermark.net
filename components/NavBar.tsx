import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import {EnableDragContext, MobileContext, AttackModeContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext, StopAnimationContext} from "../Context"
import functions from "../structures/Functions"
import Slider from "react-slider"
import "./styles/navbar.less"

import questionmark from "../assets/icons/questionmark.png"
import pixelation from "../assets/icons/pixelation.png"
import highcontrast from "../assets/icons/highcontrast.png"
import pixelshift from "../assets/icons/pixelshift.png"
import pointifiction from "../assets/icons/pointifiction.png"
import rainbowWatermarks from "../assets/icons/rainbowwatermarks.png"

interface Props {
    rerender: () => void
}

const NavBar: React.FunctionComponent<Props> = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {attackMode, setAttackMode} = useContext(AttackModeContext)
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    useEffect(() => {
        const savedAttackMode = localStorage.getItem("attackMode")
        if (savedAttackMode) setAttackMode(savedAttackMode)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        localStorage.setItem("attackMode", attackMode)
    }, [attackMode])

    return (
        <div className="navbar" onMouseEnter={() => setEnableDrag(true)}>
            <img className="navbar-item" src={rainbowWatermarks} onClick={() => setAttackMode("rainbow watermarks")}/>
            <img className="navbar-item" src={pointifiction} onClick={() => setAttackMode("pointifiction")}/>
            <img className="navbar-item" src={pixelshift} onClick={() => setAttackMode("pixel shift")}/>
            <img className="navbar-item" src={highcontrast} onClick={() => setAttackMode("high contrast")}/>
            <img className="navbar-item" src={pixelation} onClick={() => setAttackMode("pixelation")}/>
            <img className="navbar-item" src={questionmark} onClick={() => setAttackMode("question mark")}/>
        </div>
    )
}

export default NavBar