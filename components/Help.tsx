import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import {EnableDragContext, MobileContext, AttackModeContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/help.less"

import rainbowWatermarks from "../assets/images/rainbowwatermarks.png"
import pointifiction from "../assets/images/pointifiction.png"
import lineifiction from "../assets/images/lineifiction.png"
import trifiction from "../assets/images/trifiction.png"
import rectifiction from "../assets/images/rectifiction.png"
import pixelshift from "../assets/images/pixelshift.png"
import highcontrast from "../assets/images/highcontrast.png"
import pixelation from "../assets/images/pixelation.png"
import noise from "../assets/images/noise.png"
import edgeblur from "../assets/images/edgeblur.png"
import sprinkles from "../assets/images/sprinkles.png"
import networkrandomizer from "../assets/images/networkrandomizer.png"

const Help: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {attackMode, setAttackMode} = useContext(AttackModeContext)
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    return (
        <div className="help" onMouseEnter={() => setEnableDrag(true)}>
            <span className="help-text">These are all the infographics I compiled explaining the effectiveness of these methods.</span>
            <div className="help-image-container">
                <div className="help-row">
                    <img className="help-img" src={rainbowWatermarks}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={pointifiction}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={lineifiction}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={trifiction}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={rectifiction}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={pixelshift}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={highcontrast}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={pixelation}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={noise}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={edgeblur}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={sprinkles}/>
                </div>
                <div className="help-row">
                    <img className="help-img" src={networkrandomizer}/>
                </div>
            </div>
        </div>
    )
}

export default Help