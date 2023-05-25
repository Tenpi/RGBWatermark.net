import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import {EnableDragContext, MobileContext, HelpModeContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext, StopAnimationContext} from "../Context"
import functions from "../structures/Functions"
import Slider from "react-slider"
import "./styles/helpnavbar.less"

import aiprotectionmethods from "../assets/icons/aiprotectionmethods.png"
import aiarttheft from "../assets/icons/aiarttheft.png"
import howaiartworks from "../assets/icons/howaiartworks.png"
import misc from "../assets/icons/misc.png"

const HelpNavBar: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {helpMode, setHelpMode} = useContext(HelpModeContext)
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    useEffect(() => {
        const savedHelpMode = localStorage.getItem("helpMode")
        if (savedHelpMode) setHelpMode(savedHelpMode)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        localStorage.setItem("helpMode", helpMode)
    }, [helpMode])

    return (
        <div className="help-navbar" onMouseEnter={() => setEnableDrag(true)}>
            <img className="help-navbar-item" src={aiprotectionmethods} onClick={() => setHelpMode("ai protection methods")}/>
            <img className="help-navbar-item" src={aiarttheft} onClick={() => setHelpMode("ai art theft")}/>
            <img className="help-navbar-item" src={howaiartworks} onClick={() => setHelpMode("how ai art works")}/>
            <img className="help-navbar-item" src={misc} onClick={() => setHelpMode("misc")}/>
        </div>
    )
}

export default HelpNavBar