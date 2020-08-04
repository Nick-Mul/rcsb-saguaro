import {RcsbCoreDisplay} from "./RcsbCoreDisplay";
import {Selection,BaseType} from "d3-selection";
import {RcsbDisplayInterface} from "./RcsbDisplayInterface";
import {scaleLinear, ScaleLinear} from "d3-scale";
import {LocationViewInterface} from "../RcsbBoard";
import * as classes from "../scss/RcsbBoard.module.scss";
import {
    PlotSequenceInterface,
    MoveSequenceInterface,
    PlotSequenceLineInterface, RcsbD3SequenceManager
} from "../RcsbD3/RcsbD3DisplayManager/RcsbD3SequenceManager";
import {RcsbFvTrackData, RcsbFvTrackDataElementInterface} from "../../RcsbDataManager/RcsbDataManager";
import {RcsbD3Constants} from "../RcsbD3/RcsbD3Constants";

export class RcsbSequenceDisplay extends RcsbCoreDisplay implements RcsbDisplayInterface {

    private yScale: ScaleLinear<number,number> = scaleLinear();
    private intervalRatio: [number,number] = [5,16];
    private hideFlag: boolean = false;
    private currentLocation: LocationViewInterface;
    private compKey: string | undefined;
    private nonEmptyDisplay: boolean = false;


    setDynamicDisplay(){
        this.hideFlag = true;
        this.mouseoutCallBack = () => {
            this.hideFlag = true;
            this.getElements().remove();
        };
        this.mouseoverCallBack = () => {
            this.hideFlag = false;
            this.update(this.currentLocation, this.compKey);
        };
    }

    setNonEmptyDisplay(flag: boolean): void{
        this.nonEmptyDisplay = flag;
    }

    _update(where: LocationViewInterface, compKey?: string) {
        this.currentLocation = where;
        this.compKey = compKey;
        if(this.hideFlag)
            return;

        if (this._data === undefined) {
            return;
        }

        const dataElems: Array<RcsbFvTrackDataElementInterface> = this.getSequenceData().filter((s: RcsbFvTrackDataElementInterface, i: number)=> {
            return (s.begin >= where.from && s.begin <= where.to);
        });

        const elemClass = compKey != undefined ? "."+classes.rcsbElement+"_"+compKey : "."+classes.rcsbElement;
        this.g.selectAll(elemClass).remove();

        if(this.minIntervalRatio()){
            this.g.select(RcsbD3Constants.LINE).remove();
            this.g.selectAll(elemClass).data(dataElems)
                .enter()
                .append("g")
                .attr("class", classes.rcsbElement)
                .classed(classes.rcsbElement+"_" + compKey, typeof compKey === "string")
                .call(this.plot.bind(this));
        }else{
            this.getElements().remove();
            if(this.nonEmptyDisplay)
                this.plotSequenceLine();
        }
        this.checkHideFlag();
    }

    plot(elements:Selection<SVGGElement,RcsbFvTrackDataElementInterface,BaseType,undefined>){
        if(this.hideFlag)
            return;
        super.plot(elements);
        this.yScale
            .domain([0, this._height])
            .range([0, this._height]);
        const config: PlotSequenceInterface = {
            elements: elements,
            xScale: this.xScale,
            yScale: this.yScale,
            color: this._displayColor as string,
            height: this._height,
            intervalRatio: this.intervalRatio,
        };
        RcsbD3SequenceManager.plot(config);
        this.checkHideFlag();
    }

    plotSequenceLine(): void{
        const config: PlotSequenceLineInterface = {
            xScale: this.xScale,
            yScale: this.yScale,
            height: this.height(),
            g:this.g
        };
        RcsbD3SequenceManager.plotSequenceLine.call(this,config);
    }

    move(){
        const config: MoveSequenceInterface = {
            elements: this.getElements(),
            xScale: this.xScale,
            intervalRatio: this.intervalRatio,
        };
        RcsbD3SequenceManager.move(config);
    }

    private checkHideFlag(): void{
        if(this.hideFlag) {
            this.getElements().remove();
        }
    }

    private minIntervalRatio(): boolean{
        return (this.getRatio() >= this.intervalRatio[0]);
    }

    private getSequenceData(): Array<RcsbFvTrackDataElementInterface>{
        const sequence: RcsbFvTrackData = this._data;
        const elems: Array<RcsbFvTrackDataElementInterface> = new Array<RcsbFvTrackDataElementInterface>();
        sequence.forEach(seqRegion=>{
            if(typeof seqRegion.value === "string") {
                if(seqRegion.value.length>1) {
                    seqRegion.value.split("").forEach((s: string, i: number) => {
                        const e: RcsbFvTrackDataElementInterface = {
                            begin: (seqRegion.begin + i),
                            type: "RESIDUE",
                            title: "RESIDUE",
                            label: s
                        };
                        if(typeof seqRegion.oriBegin === "number")
                            e.oriBegin = seqRegion.oriBegin + i;
                        if(typeof seqRegion.sourceId === "string")
                            e.sourceId = seqRegion.sourceId;
                        if(typeof seqRegion.source === "string")
                            e.source = seqRegion.source;
                        elems.push(e);
                    });
                }else{
                    const e: RcsbFvTrackDataElementInterface = {
                        ...seqRegion,
                        type: "RESIDUE",
                        title: "RESIDUE",
                        label: seqRegion.value
                    };
                    elems.push(e);
                }
            }
        });
        return elems;
    }

}