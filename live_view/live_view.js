import ScratchBlocks from 'scratch-blocks';
import parseTextToXML from './../parser/parserUtils.js'
import generateText from './../generator/generator.js'

let workspace = null;


window.onload = function () {
    //scratch-blocks
    workspace = ScratchBlocks.inject('blocklyDiv', {
        toolbox: '<xml></xml>',
        'scrollbars': true,
        'trashcan': false,
        'readOnly': false,
        media: '/static/blocks-media/', //flag
        colours: {
            workspace: '#E0FFFF', //'#e0ffe9',
        },
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.75,
            maxScale: 4,
            minScale: 0.25,
            scaleSpeed: 1.1
        }
    });

    ScratchBlocks.mainWorkspace.getFlyout().hide();

    //text
    let editor = document.getElementById('editor');
    editor.addEventListener('input', updateWorkspace);
    editor.value = 'aaa;bbb;ccc;;zzz;yyy;;ooo "a"';//' when greenflag clicked;move {456} steps;pen up;'//go to x: {0} y: {0};pen down;repeat (zijde);move {100} steps;turn cw {({360} /{(zijde)})} degrees;end;pen up'//'when gf clicked;repeat 10;pen up;' //'define BLUB {(d)} {<f>}'
    updateWorkspace();

    //button options
    document.getElementById('xmlparser').addEventListener('click', generateTextWorkspace);
    document.getElementById('showexample').addEventListener('click', showExample);
    //glowing buttons
    document.getElementById('glowon').addEventListener('click', glowOn);
    document.getElementById('glowoff').addEventListener('click', glowOff);
    document.getElementById('report').addEventListener('click', report);
    document.getElementById('stackglowon').addEventListener('click', stackGlowOn);
    document.getElementById('stackglowoff').addEventListener('click', stackGlowOff);

    //resizing workspace
    //https://developers.google.com/blockly/guides/configure/web/resizable
    let blocklyDiv = document.getElementById('blocklyDiv');
    let blocklyArea = document.getElementById('blocklyArea');
    blocklyDiv.style.width = '50%';
    blocklyDiv.style.height = '90%';
    ScratchBlocks.svgResize(workspace);

    //addBlock('looks_say','aaa',1,1);
    //addBlock('data_addtolist','aaa',1,1);    
    //addBlock('procedures_definition','aaa',500,10);
    //addBlock('procedures_call','aaa',200,10);

    //insertSomeCodeFromXML();

    //generateText(workspace)

};

function generateTextWorkspace() {
    generateText(workspace);
}


function updateWorkspace() {
    //make xml
    //console.log('----');
    let text = editor.value;
    let xml = parseTextToXML(text);
    console.log(xml);
    if (xml) { //clear workspace
        workspace.clear();
        //add to workspace
        let dom = Blockly.Xml.textToDom(xml);
        Blockly.Xml.domToWorkspace(dom, workspace);
        workspace.cleanUp();
    }
}


//===================================================================================
// testing functions
//===================================================================================

function addBlock(prototypeName, id, x, y) {
    let block = workspace.newBlock(prototypeName, id);

    block.initSvg();

    block.setMovable(false);
    block.setEditable(false);

    block.moveBy(x, y);

    block.render();

    //console.log(block);
}

function insertSomeCodeFromXML() {

    let xml = '<xml xmlns="http://www.w3.org/1999/xhtml">\n' +
        '    <variables></variables>\n' +
        '            <block id="hQ]-n]g^y*;-^RPV]UQh" type="procedures_call">\n' +
        '                <mutation proccode="blok %n %s %b after text" argumentids="[&quot;input0&quot;,&quot;input1&quot;,&quot;input2&quot;]"></mutation>\n' +
        '                <value name="input0">\n' +
        '                    <shadow id="x]R42mYvrfQ{)T+G@cn/" type="math_number">\n' +
        '                        <field name="NUM">444</field>\n' +
        '                    </shadow>\n' +
        '                </value>\n' +
        '                <value name="input1">\n' +
        '                    <shadow id="5PYa?j=YPU7n%{y7KbBe" type="text">\n' +
        '                        <field name="TEXT">lalala</field>\n' +
        '                    </shadow>\n' +
        '                </value>\n' +
        '                <value name="input2">\n' +
        '                    <block id="Eo{N.OdXey2sykDl7czU" type="operator_lt">\n' +
        '                        <value name="OPERAND1">\n' +
        '                            <shadow id="Fqe=q!wYlSE(aM@8:(g`" type="text">\n' +
        '                                <field name="TEXT"></field>\n' +
        '                            </shadow>\n' +
        '                        </value>\n' +
        '                        <value name="OPERAND2">\n' +
        '                            <shadow id="CCQfAT1YY%ukDp!mgxqp" type="text">\n' +
        '                                <field name="TEXT"></field>\n' +
        '                            </shadow>\n' +
        '                        </value>\n' +
        '                    </block>\n' +
        '                </value>\n' +
        '            </block>\n' +
        '</xml>\n';
    xml = '<xml xmlns="http://www.w3.org/1999/xhtml">\n' +
        '    <variables></variables>\n' +
        '    <block type="procedures_call" id="SaA0RG_sd@{sUN5%SWpW" x="119" y="267">\n' +
        '        <mutation proccode="blok %n" argumentids="[&quot;input0&quot;]" warp="null"></mutation>\n' +
        '        <value name="input0">\n' +
        '            <shadow type="math_number" id="xAsO+lm[%y|!-0je(qxh">\n' +
        '                <field name="NUM">42</field>\n' +
        '            </shadow>\n' +
        '        </value>\n' +
        '    </block>\n' +
        '</xml>'
    //console.log(xml);
    let dom = Blockly.Xml.textToDom(xml);
    Blockly.Xml.domToWorkspace(dom, workspace);
    //workspace.getById(id) //https://developers.google.com/blockly/reference/js/Blockly.Workspace#.getById
}

//===================================================================================
// indicationtestfucnitons
//===================================================================================


let glowOn = function () {
    let id = document.getElementById('blockid').value;
    workspace.glowBlock(id, true);
};

let glowOff = function () {
    let id = document.getElementById('blockid').value;
    workspace.glowBlock(id, false);
};

let report = function () {
    let id = document.getElementById('blockid').value;
    workspace.reportValue(id, 'dit is ' + id);
};

let stackGlowOff = function () {
    let id = document.getElementById('blockid').value;
    workspace.glowStack(id, false);
};

let stackGlowOn = function () {
    let id = document.getElementById('blockid').value;
    workspace.glowStack(id, true);
};


function showExample() {
    let code = 'when gf clicked \nif < {(blub)} contains {"citroen"} ? > \nif < {(length of {(blub)})} = {2} >\nrepeat 10\nrepeat 10\nset pen color to {(pick random {0} to {255})}\nglide {2} secs to x: {(pick random {0} to {240})} y: {(pick random {0} to {180})}\npen up\nend\ngo to x: {0} y: {0}'
    editor.value = code;
    updateWorkspace();
}