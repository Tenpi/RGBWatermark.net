import React, {useEffect, useContext, useReducer, useState} from "react"
import {EnableDragContext, AttackModeContext} from "../Context"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import RainbowOptions from "../components/RainbowOptions"
import RainbowImage from "../components/RainbowImage"
import PointImage from "../components/Pointifiction"
import PixelShiftImage from "../components/PixelShift"
import HighContrastImage from "../components/HighContrast"
import PixelationImage from "../components/Pixelation"
import NoiseImage from "../components/Noise"
import EdgeBlurImage from "../components/EdgeBlur"
import SprinkleImage from "../components/Sprinkles"
import Help from "../components/Help"
import Footer from "../components/Footer"
import Conversion from "../components/Conversion"
import Inflation from "../components/Inflation"
import AIWatermark from "../components/AIWatermark"
import Fence from "../components/Fence"
import AdversarialNoise from "../components/AdversarialNoise"

const HomePage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {attackMode, setAttackMode} = useContext(AttackModeContext)

    useEffect(() => {
        document.title = "RGBWatermark: Art Protection Tools against AI/Machine Learning Theft"
    }, [])

    const getAttack = () => {
        if (attackMode === "rainbow watermarks") {
            return (<><RainbowOptions/><RainbowImage/></>)
        } else if (attackMode === "pointifiction") {
            return (<PointImage/>)
        } else if (attackMode === "pixel shift") {
            return (<PixelShiftImage/>)
        } else if (attackMode === "high contrast") {
            return (<HighContrastImage/>)
        } else if (attackMode === "pixelation") {
            return (<PixelationImage/>)
        } else if (attackMode === "noise") {
            return (<NoiseImage/>)
        } else if (attackMode === "edge blur") {
            return (<EdgeBlurImage/>)
        } else if (attackMode === "sprinkles") {
            return (<SprinkleImage/>)
        } else if (attackMode === "conversion") {
            return (<Conversion/>)
        } else if (attackMode === "inflation") {
            return (<Inflation/>)
        } else if (attackMode === "ai watermark") {
            return (<AIWatermark/>)
        } else if (attackMode === "fence") {
            return (<Fence/>)
        } else if (attackMode === "adversarial noise") {
            return (<AdversarialNoise/>)
        } else if (attackMode === "question mark") {
            return (<Help/>)
        }
    }

    return (
        <>
        <TitleBar rerender={forceUpdate}/>
        <NavBar rerender={forceUpdate}/>
        <div className="body">
            {getAttack()}
        </div>
        <Footer/>
        </>
    )
}

export default HomePage