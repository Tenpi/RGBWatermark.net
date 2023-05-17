import React, {useEffect, useContext, useReducer, useState} from "react"
import {EnableDragContext, AttackModeContext} from "../Context"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import RainbowOptions from "../components/RainbowOptions"
import RainbowImage from "../components/RainbowImage"
import PointImage from "../components/PointImage"
import PixelShiftImage from "../components/PixelShiftImage"
import HighContrastImage from "../components/HighContrastImage"
import PixelationImage from "../components/PixelationImage"
import NoiseImage from "../components/NoiseImage"
import Help from "../components/Help"
import Footer from "../components/Footer"

const HomePage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {attackMode, setAttackMode} = useContext(AttackModeContext)

    useEffect(() => {
        document.title = "RGBWatermark: Anti-AI/Machine Learning Watermarks"
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