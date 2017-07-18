import React from 'react'
import { toggleMessageArrowStyle } from './../reducers'
import messageBorders from './message-borders.png'
import messageBordersAsync from './message-borders-async.png'

export default function(props) {
    const { dispatch, message, layout, controlsColor } = props;
    const key = message.key;

    function handleMouseDown(e) {
        // We don't want the parent div to receive any mouse down event if
        // the remove button is clicked
        e.stopPropagation();
        e.preventDefault();
    }

    const borderStyle = controlsColor === 'transparent' ? 'none' : 'solid';

    const height = 30;
    const width = 30;
    const pointsLeft = layout[key].pointsLeft;

    const png = message.isAsync ? messageBorders : messageBordersAsync;
    const borderImage = 'url(' + png + ') 0 9 17 fill repeat';
    const borderWidth = (pointsLeft ?
                         '0px 0px 17px 9px' :
                         '0px 9px 17px 0px');

    return (
        <div className="message-end" onClick={() => dispatch(toggleMessageArrowStyle(key))}
                onMouseDown={handleMouseDown}
                style={{
                    position: 'absolute',
                    right: pointsLeft ? undefined : -24,
                    left: pointsLeft ? -24 : undefined,
                    bottom: -57,
                    width: width,
                    height: height,
                    borderRadius: '15px',
                    border: '1px dotted ' + controlsColor,
                    }} >
            <div style={{
                    position: 'relative',
                    left: 8,
                    top: 8,
                    borderStyle,
                    borderWidth,
                    borderImage,
                    width: 3,
                    height: 1,
                    }} />
        </div>
    );
}
