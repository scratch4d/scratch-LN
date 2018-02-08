import chevrotain from 'chevrotain'
import builder from 'xmlbuilder';
import blocks from './blocks'

export default function myGrammar() {
    "use strict";
    const createToken = chevrotain.createToken;
    const tokenMatcher = chevrotain.tokenMatcher;
    const Lexer = chevrotain.Lexer;
    const Parser = chevrotain.Parser;

    var Label = createToken({
        name: "Label",
        pattern:
        //not [] {} () " :: ; \n # unless escaped
        // : followed by not : or in the end
        //    /(:?[^\{\(\)\}\<\>\[\]:;\\"\n#]|\\[\{\(\)\}\<\>\[\]:;\\"\n#])+:?/,
            /(:?[^\{\(\)\}\<\>\[\]:;\\"\n#]|\\[\{\(\)\}\<\>\[\]:;\\"\n#])+/,
        line_breaks: true
    });
    const LCurly = createToken({
        name: "LCurly",
        pattern: /{/
    });
    const RCurly = createToken({
        name: "RCurly",
        pattern: /}/
    });

    const LPar = createToken({
        name: "LPar",
        pattern: /\(/
    });
    const RPar = createToken({
        name: "RPar",
        pattern: /\)/
    });

    var GreaterThan = createToken({
        name: "GreaterThan",
        pattern: />/
    });
    var LessThan = createToken({
        name: "LessThan",
        pattern: /</
    });
    var LSquareBracket = createToken({
        name: "LSquareBracket",
        pattern: /\[/
    });
    var RSquareBracket = createToken({
        name: "RSquareBracket",
        pattern: /\]/
    });
    var DoubleColon = createToken({
        name: "DoubleColon",
        pattern: /::/
    });
    const Arg = createToken({
        name: "Arg",
        pattern: Lexer.NA
    });
    const TextArg = createToken({
        name: "TextArg",
        pattern: /"[^"]*"/,
        categories: Arg
    });
    const NumberArg = createToken({
        name: "NumberArg",
        pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
        categories: [Arg, Label]
    });
    const ColorArg = createToken({
        name: "ColorArg",
        pattern: /#[0-9a-z]{6}/,
        categories: [Arg]
    });
    const Forever = createToken({
        name: "Forever",
        pattern: /forever/,
    });
    const End = createToken({
        name: "End",
        pattern: /end/,
    });
    const Then = createToken({
        name: "Then",
        pattern: /then/,
    });
    const Repeat = createToken({
        name: "Repeat",
        pattern: /repeat/,
    });

    const If = createToken({
        name: "If",
        pattern: /if/
    });
    const Else = createToken({
        name: "Else",
        pattern: /else/,
    });

    const Until = createToken({
        name: "Until",
        pattern: /until/,
        categories: Label //because this word occurs in 'until done', should not be a problem as it is never first
    });

    // marking WhiteSpace as 'SKIPPED' makes the lexer skip it.
    const WhiteSpace = createToken({
        name: "WhiteSpace",
        pattern: / +/,
        group: Lexer.SKIPPED,
        line_breaks: false
    });

    let LineEnd = createToken({
        name: "LineEnd",
        pattern: /;\n|;|\n/,
        line_breaks: true
    })

    const allTokens = [
        WhiteSpace,
        Arg, TextArg, NumberArg, ColorArg,
        Forever, End, Until, Repeat, If, Else, Then,
        LineEnd,
        Label,
        LCurly, RCurly,
        LPar, RPar,
        GreaterThan, LessThan,
        LSquareBracket, RSquareBracket,
        DoubleColon,
    ];
    const MyLexer = new Lexer(allTokens);


    // ----------------- parser -----------------
    // Note that this is a Pure grammar, it only describes the grammar
    // Not any actions (semantics) to perform during parsing.
    function MyParser(input) {
        Parser.call(this, input, allTokens, {
            outputCst: true
        });

        const $ = this;

        $.RULE("multipleStacks", () => {
            $.AT_LEAST_ONE_SEP({
                SEP: LineEnd,
                DEF: () => {
                    $.SUBRULE($.stack);
                }
            });

        });

        $.RULE("scripts", () => {
            $.MANY1(function() {
                $.CONSUME1(LineEnd);
            })
            $.AT_LEAST_ONE2(function() {

                $.OR([{
                    ALT: function() {
                        $.SUBRULE($.multipleStacks);
                    }
                }, {
                    ALT: function() {
                        return $.SUBRULE($.reporterblock);
                    }
                }, {
                    ALT: function() {
                        return $.SUBRULE($.booleanblock);
                    }
                }]);

            })

            $.MANY2(function() {
                $.CONSUME2(LineEnd);
            })

        });

        $.RULE("end", () => {
            $.CONSUME(End);
            $.OPTION1(() => {
                $.CONSUME1(LineEnd);
            })
        });

        $.RULE("forever", () => {
            $.CONSUME(Forever);
            $.OPTION1(() => {
                $.CONSUME1(LineEnd);
            })
            $.OPTION2(() => {
                $.SUBRULE1($.stack);
            })
            $.OPTION3(() => {
                $.SUBRULE1($.end);
            })
        });

        $.RULE("repeat", () => {
            $.CONSUME(Repeat);
            $.SUBRULE($.countableinput);
            $.OPTION1(() => {
                $.CONSUME1(LineEnd);
            })
            $.OPTION2(() => {
                $.SUBRULE1($.stack);
            })
            $.OPTION3(() => {
                $.SUBRULE1($.end);
            })

        });

        $.RULE("repeatuntil", () => {
            $.CONSUME(Repeat);
            $.CONSUME(Until);
            $.SUBRULE($.booleanblock);
            $.OPTION1(() => {
                $.CONSUME1(LineEnd);
            })
            $.OPTION2(() => {
                $.SUBRULE1($.stack);
            })
            $.OPTION3(() => {
                $.SUBRULE1($.end);
            })
        });

        $.RULE("ifelse", () => {
            $.CONSUME(If);
            $.SUBRULE($.booleanblock);
            $.OPTION1(() => {
                $.CONSUME(Then);
            })
            $.OPTION2(() => {
                $.CONSUME1(LineEnd);
            })
            $.OPTION3(() => {
                $.SUBRULE1($.stack);
            })
            $.OPTION4(() => {
                $.SUBRULE1($.else);
            })
            $.OPTION5(() => {
                $.SUBRULE1($.end);
            })
        });
        $.RULE("else", () => {
            $.CONSUME(Else);
            $.OPTION1(() => {
                $.CONSUME2(LineEnd);
            })
            $.OPTION2(() => {
                $.SUBRULE2($.stack);
            })
        });
        $.RULE("stack", () => {
            $.AT_LEAST_ONE(function() {
                $.SUBRULE($.stackline);
            });
        });

        $.RULE("stackline", () => {
            $.OR([{
                ALT: function() {
                    return $.SUBRULE($.block);
                }
            }, {
                ALT: function() {
                    return $.SUBRULE($.forever);
                }
            }, {
                ALT: function() {
                    return $.SUBRULE($.repeat);
                }
            }, {
                ALT: function() {
                    return $.SUBRULE($.repeatuntil);
                }
            }, {
                ALT: function() {
                    return $.SUBRULE($.ifelse);
                }
            }]);
        });

        $.RULE("block", () => {
            $.AT_LEAST_ONE(function() {
                $.OR2([{
                    ALT: function() {
                        return $.CONSUME1(Label);
                    }
                }, {
                    ALT: function() {
                        return $.SUBRULE($.argument);
                    }
                }]);

            });
            $.OPTION(() => {
                $.SUBRULE($.option)
            })
            $.OPTION2(() => {
                $.CONSUME1(LineEnd);
            })

        });

        $.RULE("option", () => {
            $.CONSUME(DoubleColon);
            $.CONSUME(Label);
        });

        $.RULE("argument", function() {
            $.OR1([{
                ALT: function() {
                    $.CONSUME(LCurly);
                    $.OPTION(() => {
                        $.OR2([{
                            ALT: function() {
                                return $.SUBRULE($.primitive);
                            }
                        }, {
                            ALT: function() {
                                return $.SUBRULE($.reporterblock);
                            }
                        }, {
                            ALT: function() {
                                return $.SUBRULE($.booleanblock);
                            }
                        }]);
                    })
                    $.CONSUME(RCurly);
                }
            }, {
                ALT: function() {
                    return $.SUBRULE($.menu);
                }
            }])

        });

        $.RULE("countableinput", function() {

            $.OR([{
                ALT: function() {
                    return $.SUBRULE($.primitive);
                }
            }, {
                ALT: function() {
                    return $.SUBRULE($.reporterblock);
                }
            }]);


        });

        $.RULE("primitive", function() {
            $.CONSUME(Arg);
        });

        $.RULE("reporterblock", function() {
            $.CONSUME(LPar);
            $.OPTION(() => {
                $.SUBRULE($.block);
            })
            $.CONSUME(RPar);

        });

        $.RULE("menu", function() {
            $.CONSUME(LSquareBracket);
            $.OPTION(() => {
                $.CONSUME1(Label);
            })
            $.CONSUME(RSquareBracket);
        });

        $.RULE("booleanblock", function() {
            $.CONSUME(LessThan);
            $.OPTION(() => {
                $.SUBRULE($.block);
            })
            $.CONSUME(GreaterThan);

        });


        // very important to call this after all the rules have been defined.
        // otherwise the parser may not work correctly as it will lack information
        // derived during the self analysis phase.
        Parser.performSelfAnalysis(this);
    }

    MyParser.prototype = Object.create(Parser.prototype);
    MyParser.prototype.constructor = MyParser;


    // wrapping it all together
    // reuse the same parser instance.
    const parser = new MyParser([]);


    // ----------------- Interpreter -----------------
    const BaseCstVisitor = parser.getBaseCstVisitorConstructor()

    //======================================================================================
    // ----------------- information -----------------
    class InformationVisitor extends BaseCstVisitor {

        constructor() {
            super()
                // This helper will detect any missing or redundant methods on this visitor
            this.validateVisitor()
        }

        multipleStacks(ctx) {
            var s = []
            for (var i = 0; i < ctx.stack.length; i++) {
                s.push(this.visit(ctx.stack[i]))
            }
            return {
                'type': 'multiple stacks',
                'stacks': s
            }
        }

        scripts(ctx) {
            var s = []
            for (var i = 0; i < ctx.multipleStacks.length; i++) {
                s.push(this.visit(ctx.multipleStacks[i]))
            }
            for (var i = 0; i < ctx.reporterblock.length; i++) {
                s.push(this.visit(ctx.reporterblock[i]))
            }
            for (var i = 0; i < ctx.booleanblock.length; i++) {
                s.push(this.visit(ctx.booleanblock[i]))
            }
            return s
        }

        end(ctx) {}

        forever(ctx) {
            return {
                'action': 'forever',
                'stack': this.visit(ctx.stack)
            }
        }


        repeat(ctx) {
            return {
                'action': 'repeat',
                'amount': this.visit(ctx.countableinput),
                'stack': this.visit(ctx.stack)
            }
        }

        repeatuntil(ctx) {
            return {
                'action': 'repeat until',
                'until': this.visit(ctx.booleanblock),
                'stack': this.visit(ctx.stack)
            }
        }

        ifelse(ctx) {
            if (ctx.else.length > 0) {
                return {
                    'action': 'ifelse',
                    'until': this.visit(ctx.booleanblock),
                    'stack_one': ctx.stack.length > 0 ? this.visit(ctx.stack[0]) : '',
                    'stack_two': this.visit(ctx.else)
                }
            } else {
                return {
                    'action': 'if',
                    'until': this.visit(ctx.booleanblock),
                    'stack_one': ctx.stack.length > 0 ? this.visit(ctx.stack[0]) : ''
                }
            }
        }

        else(ctx) {
            return ctx.stack.length > 0 ? this.visit(ctx.stack[0]) : ''
        }
        stack(ctx) {
            var blocks = []
            for (var i = 0; i < ctx.stackline.length; i++) {
                blocks.push(this.visit(ctx.stackline[i]))
            }
            return blocks
        }

        stackline(ctx) {
            var v = ctx
            if (ctx.forever.length > 0) {
                v = this.visit(ctx.forever)
            } else if (ctx.repeatuntil.length > 0) {
                v = this.visit(ctx.repeatuntil)
            } else if (ctx.repeat.length > 0) {
                v = this.visit(ctx.repeat)
            } else if (ctx.block.length > 0) {
                v = this.visit(ctx.block)
            } else if (ctx.ifelse.length > 0) {
                v = this.visit(ctx.ifelse)
            }
            return {
                'type': 'stackblock',
                'value': v
            }
        }

        block(ctx) {
            var text = ''
            var a = 0;
            for (var i = 0; i < ctx.Label.length; i++) {
                if (a < ctx.argument.length) {
                    while (a < ctx.argument.length && this.getOffsetArgument(ctx.argument[a]) < ctx.Label[i].startOffset) {
                        text += '{}' //this.getOffsetArgument(ctx.argument[a]) 
                        a++;
                    }
                }

                text += ctx.Label[i].image
            }
            for (a; a < ctx.argument.length; a++) {
                text += '{}'
            }


            var args = []
            for (var i = 0; i < ctx.argument.length; i++) {
                args.push(this.visit(ctx.argument[i]))
            }
            var ofs = 0;
            if(ctx.argument[0]){
                ofs = this.getOffsetArgument(ctx.argument[0]) < ctx.Label[0].startOffset ? this.getOffsetArgument(ctx.argument[0]) : ctx.Label[0].startOffset
            }else{
                ofs = ctx.Label[0].startOffset
            }
            return {
                'text': text,
                'argumenten': args,
                'option': this.visit(ctx.option),
                'offset': ofs
            }
        }

        getOffsetArgument(arg) {
            if (!arg) {
                return 999999999999999 //todo integer max int ofzo
            }
            var child = this.visit(arg)
            return child.offset
        }

        option(ctx) {
            return {
                'text': ctx.Label[0].image,
                'type': 'option',
                'offset': ctx.DoubleColon[0].startOffset,
            }
        }

        argument(ctx) {
            if (ctx.primitive.length > 0) {
                return this.visit(ctx.primitive)
            } else if (ctx.reporterblock.length > 0) {
                return this.visit(ctx.reporterblock)
            } else if (ctx.booleanblock.length > 0) {
                return this.visit(ctx.booleanblock)
            } else if (ctx.menu.length > 0) {
                return this.visit(ctx.menu)
            } else {
                //empty 
                return {
                    'value': '',
                    'type': 'empty',
                    'offset': ctx.LCurly[0].startOffset,
                }
            }
        }

        primitive(ctx) {
            if (tokenMatcher(ctx.Arg[0], NumberArg)) {
                return {
                    'value': ctx.Arg[0].image,
                    'type': 'number',
                    'offset': ctx.Arg[0].startOffset,
                }
            } else if (tokenMatcher(ctx.Arg[0], ColorArg)) {
                return {
                    'value': ctx.Arg[0].image,
                    'type': 'color',
                    'offset': ctx.Arg[0].startOffset,
                }
            } else {
                return {
                    'value': ctx.Arg[0].image,
                    'type': 'text',
                    'offset': ctx.Arg[0].startOffset,
                }
            }

        }


        countableinput(ctx) {
            if (ctx.primitive.length > 0) {
                return this.visit(ctx.primitive)
            } else if (ctx.reporterblock.length > 0) {
                return this.visit(ctx.reporterblock)
            }
        }
        menu(ctx) {
            return {
                'type': 'menu',
                'value': ctx.Label[0].image,
                'offset': ctx.LSquareBracket[0].startOffset,
            };
        }

        reporterblock(ctx) {
            var b = this.visit(ctx.block);
            return {
                'type': 'reporterblock',
                'value': b,
                'offset': b.offset,
                'text':b.text
            };
        }

        booleanblock(ctx) {
            var b = this.visit(ctx.block);
            return {
                'type': 'booleanblock',
                'value': b,
                'offset': b.offset,
                'text':b.text
            };
        }


    }


    //======================================================================================
    // ----------------- XML -----------------
    class XMLVisitor extends BaseCstVisitor {

        constructor(coordinate = {
                x: 0,
                y: 0
            },
            increase = {
                x: 75,
                y: 100
            }) {
            super()
                // This helper will detect any missing or redundant methods on this visitor
            this.validateVisitor()

            //the visitor stores an xml, this is reinit every visit call.
            //the builder keeps where we are adding the next block
            this.xml = null;
            //xml root
            this.xmlRoot = null;
            //first block in this xml
            this.firstBlock = null;

            //location of the blocks
            this.location = coordinate;
            this.increase = increase;

            //what kind of blocks should we build now? top, reporter, stack or boolean?
            //top = the first block in a stack, can be a stack or hat block
            //todo: cap block
            this.modus = 'root'
            this.scriptCounter = 0;
            this.blockCounter = 0;
            this.prevBlockCounter = 0;
            this.isTop = true;

            //id generation
            this.counter = 0

            //variables
            this.varMap = new Object();
            this.varCounter = 0

            //warnings
            this.warnings = []

            //informationvistor
            this.infoVisitor = new InformationVisitor();

        }

        getNextId() {
            return this.counter++;
        }

        getVariableID(varName, variableType = '') {
            //if first time this variable is encoutered, create an ID for it
            if (!this.varMap[varName]) {
                this.varMap[varName] = {
                    'id': 'var' + this.varCounter++,
                    'variableType': variableType
                }
            }
            return this.varMap[varName].id;
        }


        addLocationBelow(xmlElement) {
            xmlElement.att('x', this.location.x);
            if (this.prevBlockCounter == 0) {
                xmlElement.att('y', this.location.y);
                this.prevBlockCounter = this.blockCounter;
            } else {
                xmlElement.att('y', this.location.y + this.increase.y * this.prevBlockCounter);
                this.prevBlockCounter = this.blockCounter;
            }
        }

        getXML(cst) {
            //reset
            this.modus = 'stackblock'
            this.xml = builder.begin().ele('xml').att('xmlns', 'http://www.w3.org/1999/xhtml');
            this.xmlRoot = this.xml;
            this.visit(cst);
            //insert variables
            if (this.firstBlock) {
                this.xml = this.firstBlock.insertBefore('variables');
            } else {
                this.xml = this.xmlRoot.ele('variables');
            }
            for (var key in this.varMap) {
                if (this.varMap.hasOwnProperty(key)) {
                    this.xml.ele('variable', {
                        'type': this.varMap[key].variableType,
                        'id': this.varMap[key].id,
                    }, key);
                }
            }
            return this.xml.end({
                pretty: true
            });

        }

        visitSubStack(stack) {
            var head = this.xml;
            this.visit(stack)
            this.xml = head;
        }

        scripts(ctx) {
            for (var i = 0; i < ctx.multipleStacks.length; i++) {
                this.visit(ctx.multipleStacks[i])
            }
            for (var i = 0; i < ctx.reporterblock.length; i++) {
                this.isTop = true
                this.visit(ctx.reporterblock[i])
                this.addLocationBelow(this.xml)
                this.scriptCounter++;
            }
            for (var i = 0; i < ctx.booleanblock.length; i++) {
                this.isTop = true
                this.visit(ctx.booleanblock[i])
                this.addLocationBelow(this.xml)
                this.scriptCounter++;
            }
        }

        multipleStacks(ctx) {
            for (var i = 0; i < ctx.stack.length; i++) {
                this.isTop = true
                this.visit(ctx.stack[i])
                this.addLocationBelow(this.xml)
                this.xml = this.xml.up()
                this.scriptCounter++;
            }
        }



        end(ctx) { /*will never be used*/ }

        forever(ctx) {
            this.xml = this.xml.ele('block', {
                'type': 'control_forever',
                'id': this.getNextId(),
            }, ' ');
            this.xml = this.xml.ele('statement ', {
                'name': 'SUBSTACK'
            }, ' ');
            this.visitSubStack(ctx.stack);
            this.xml = this.xml.up()
        }


        repeat(ctx) {
            this.xml = this.xml.ele('block', {
                'type': 'control_repeat',
                'id': this.getNextId(),
            }).ele('value', {
                'name': 'TIMES'
            });
            this.visit(ctx.countableinput);
            this.xml = this.xml.up();
            this.xml = this.xml.ele('statement ', {
                'name': 'SUBSTACK'
            });
            this.visitSubStack(ctx.stack);
            this.xml = this.xml.up(); //go out of statement 
        }

        repeatuntil(ctx) {
            this.xml = this.xml.ele('block', {
                'type': 'control_repeat_until',
                'id': this.getNextId(),
            });
            this.xml = this.xml.ele('value', {
                'name': 'CONDITION'
            });
            this.visit(ctx.booleanblock);
            this.xml = this.xml.up();
            this.xml = this.xml.ele('statement ', {
                'name': 'SUBSTACK'
            });
            this.visitSubStack(ctx.stack);
            this.xml = this.xml.up();
        }

        ifelse(ctx) {
            if (ctx.else.length === 0) {
                this.xml = this.xml.ele('block', {
                    'type': 'control_if',
                    'id': this.getNextId(),
                });
            } else {
                this.xml = this.xml.ele('block', {
                    'type': 'control_if_else',
                    'id': this.getNextId(),
                });
            }
            this.xml = this.xml.ele('value', {
                'name': 'CONDITION'
            });
            this.visit(ctx.booleanblock);
            //Stack
            this.xml = this.xml.up(); //go up from condition
            this.xml = this.xml.ele('statement ', {
                'name': 'SUBSTACK'
            });
            this.visitSubStack(ctx.stack); //when no index is given it is always 0
            this.xml = this.xml.up();
            if (ctx.else.length != 0) {
                this.visit(ctx.else);
            }
        }

        else(ctx) {
            this.xml = this.xml.ele('statement ', {
                'name': 'SUBSTACK2'
            });
            this.visitSubStack(ctx.stack[0]);
            this.xml = this.xml.up();
        }

        stack(ctx) {
            for (var i = 0; i < ctx.stackline.length; i++) {
                this.visit(ctx.stackline[i])
                this.xml = this.xml.ele('next');
            }
            for (var i = 0; i < ctx.stackline.length - 1; i++) {
                this.xml = this.xml.up().up();
            }
            this.xml = this.xml.up(); //End with blocks open so that insertbefore works #hacky
        }

        stackline(ctx) {
            if (ctx.forever.length > 0) {
                this.visit(ctx.forever)
            } else if (ctx.repeatuntil.length > 0) {
                this.visit(ctx.repeatuntil)
            } else if (ctx.repeat.length > 0) {
                this.visit(ctx.repeat)
            } else if (ctx.block.length > 0) {
                this.visit(ctx.block)
            } else if (ctx.ifelse.length > 0) {
                this.visit(ctx.ifelse)
            }
            if (!this.firstBlock) {
                this.firstBlock = this.xml
            }
            this.blockCounter++;
        }

        makeMatchString(ctx) {
            var matchString = ''
            var a = 0;
            for (var i = 0; i < ctx.Label.length; i++) {
                if (a < ctx.argument.length) {
                    while (a < ctx.argument.length && this.getOffsetArgument(ctx.argument[a]) < ctx.Label[i].startOffset) {
                        matchString += ' %' + (a + 1) + ' ';
                        ++a;
                    }
                }
                matchString += ' ' + ctx.Label[i].image + ' ';
            }
            for (a; a < ctx.argument.length; a++) {
                matchString += ' %' + (a + 1) + ' ';
            }
            return this.cleanupText(matchString)
        }

        generateStackBlock(ctx, matchString) {

            var blockid = this.getNextId();
            this.xml = this.xml.ele('block', {
                'id': blockid,
            });
            this.xml.att('type', 'procedures_call')

            this.addMutation(ctx, matchString, blockid, true);

        }

        addMutation(ctx, matchString, blockid, visitArgs) {
            var args = []
            var argumentnames = []
            var argumentdefaults = []
            var argumentids = []

            //this is a very weird construction but it works...
            //assign this to a variable so that it can be accesed by the function
            var thisVisitor = this;
            var proccode = matchString.replace(/%[1-9]/g, function(m) {
                var index = m[1] - 1;
                return thisVisitor.getPlaceholder(ctx.argument[index])
            });
            for (var i = 0; i < ctx.argument.length; i++) {
                //make names
                args.push(arg);
                var name = this.getString(ctx.argument[i])
                if(!name){
                    name = 'argumentname_' + blockid + '_' + i
                }
                argumentnames.push(name)//('argumentname_' + blockid + '_' + i)
                argumentdefaults.push('')
                argumentids.push(this.getVariableID(argumentnames[argumentnames.length - 1],'arg'))//(blockid + '_arg_' + this.getNextId())
                
                if (visitArgs) {
                        //make xml
                    this.xml = this.xml.ele('value', {
                        'name': argumentnames[argumentnames.length - 1]
                    });
                    var arg = this.visit(ctx.argument[i])
                    this.xml = this.xml.up();
                }

            }
            if (argumentnames.length > 0) {
                this.xml.ele('mutation', {
                    'proccode': proccode,
                    'argumentnames': '["' + argumentnames.join('","') + '"]',
                    //'argumentdefaults': "['" + argumentdefaults.join("','") + "']",
                    'warp': 'false',
                    'argumentids': '["' + argumentids.join('","') + '"]'
                });
            } else {
                this.xml.ele('mutation', {
                    'proccode': proccode
                });
            }
        }

        cleanupText(text) {
            //remove double spaces to easier match, because life is already difficult enough <3.
            text = text.replace(/ +(?= )/g, '');
            //' ?' 
            text = text.replace(/ +(?=[\?])/g, '');
            //text = text.replace(/ +(?=[\%][^sbn])/g, '');
            //remove spaces at beginning and end
            text = text.trim();
            return text;
        }

        generateReporterBlock(ctx, matchString) {
            var varID = this.getVariableID(matchString);
            if (this.getString(ctx.option[0]) == 'list') {
                this.xml = this.xml.ele('block', {
                    'type': 'data_listcontents',
                    'id': this.getNextId(),
                }).ele('field', {
                    'name': 'LIST',
                    'id': varID,
                }, matchString)
                this.xml = this.xml.up(); //up field
            } else {
                this.xml = this.xml.ele('block', {
                    'type': 'data_variable',
                    'id': this.getNextId(),
                }).ele('field', {
                    'name': 'VARIABLE',
                    'id': varID,
                }, matchString)
                this.xml = this.xml.up(); //up field
            }
        }

        generateBooleanBlock(ctx, matchString) {
            this.xml = this.xml.ele('block', {
                'type': 'extension_wedo_boolean',
                'id': this.getNextId(),
            })
        }

        block(ctx) {
            var matchString = this.makeMatchString(ctx)
            //console.log(matchString)
            if (matchString.startsWith("define")) {
                matchString = matchString.replace(/define/, '');
                var blockid = this.getNextId()
                this.xml = this.xml.ele('block', {
                    'type': 'procedures_definition',
                    'id': blockid,
                })
                this.xml = this.xml.ele('statement', {
                        'name': 'custom_block'
                    }).ele('shadow', {
                        'type': 'procedures_prototype'
                    })
                    /*.ele('mutation',{
                                    'proccode':'helo'
                                })*/
                this.addMutation(ctx, matchString, blockid, false);
                this.xml = this.xml.up().up()
            } else if (matchString in blocks) {
                blocks[matchString](ctx, this);
                if (this.modus == 'reporterblock' || this.modus == 'booleanblock') {
                    if (this.isTop) {
                        this.addLocationBelow(this.xml)
                    }
                    this.xml = this.xml.up();
                }
            } else { //what should be done if the block is unknown
                switch (this.modus) {
                    case 'stackblock':
                        this.generateStackBlock(ctx, matchString);
                        break;
                    case 'reporterblock':
                        this.generateReporterBlock(ctx, matchString);
                        break;
                    case 'booleanblock':
                        this.generateBooleanBlock(ctx, matchString);
                        break;
                }
                if (this.modus == 'reporterblock' || this.modus == 'booleanblock') {
                    if (!this.firstBlock) {
                        this.firstBlock = this.xml
                    }

                    if (this.isTop) {
                        this.addLocationBelow(this.xml)
                    }

                    this.blockCounter++;

                    this.xml = this.xml.up();
                }
            }
            this.isTop = false
        }

        argument(ctx) {
            if (ctx.primitive.length > 0) {
                return this.visit(ctx.primitive)
            } else if (ctx.reporterblock.length > 0) {
                return this.visit(ctx.reporterblock)
            } else if (ctx.booleanblock.length > 0) {
                return this.visit(ctx.booleanblock)
            } else if (ctx.menu.length > 0) {
                return this.visit(ctx.menu)
            } else {
                //empty 
            }
        }
        getString(ctx) {
            if (ctx) {
                var o = this.infoVisitor.visit(ctx)
                return o.text
            } else {
                return ''
            }
        }

        getPlaceholder(ctx) {
            if (!ctx || !ctx.children) {
                return '%s'
            }
            var type = this.getType(ctx)
            if (type == 'number') {
                return '%n'
            } else if (type == 'booleanblock') {
                return '%b'
            } else {
                return '%s'
            }
        }

        getType(ctx) {
            if (ctx) {
                var o = this.infoVisitor.visit(ctx)
                return o.type
            } else {
                return 'empty'
            }
        }
        getOffsetArgument(arg) {
            if (!arg) {
                console.log('This should not happen')
                return 999999999999999999999 //todo maxint ofzo om te vermijden dat het ine en oneindige lus raakt?
            }
            /*if (arg.children.menu.length > 0) {
                return arg.children.menu[0].children.LSquareBracket[0].startOffset
            } else {
                return arg.children.LCurly[0].startOffset
            }*/
            var child = this.infoVisitor.visit(arg)
            return child.offset
        }

        menu(ctx) {
            if (ctx.Label[0]) {
                return ctx.Label[0].image;
            } else {
                return ""
            }
        }

        option(ctx) {

        }

        primitive(ctx) {
            if (tokenMatcher(ctx.Arg[0], NumberArg)) {
                this.xml.ele('shadow', {
                    'type': 'math_number',
                    'id': this.getNextId(),
                }).ele('field', {
                    'name': 'NUM',
                }, ctx.Arg[0].image)
            } else if (tokenMatcher(ctx.Arg[0], ColorArg)) {
                this.xml.ele('shadow', {
                    'type': 'colour_picker',
                    'id': this.getNextId(),
                }).ele('field', {
                    'name': 'COLOUR',
                }, ctx.Arg[0].image)
            } else {
                this.xml.ele('shadow', {
                    'type': 'text',
                    'id': this.getNextId(),
                }).ele('field', {
                    'name': 'TEXT',
                }, ctx.Arg[0].image)

            }
            return ctx.Arg[0].image;
        }

        reporterblock(ctx) {
            var prevModus = this.modus;
            this.modus = 'reporterblock';
            this.visit(ctx.block);
            this.modus = prevModus;
        }

        booleanblock(ctx) {
            var prevModus = this.modus;
            this.modus = 'booleanblock';
            this.visit(ctx.block);
            this.modus = prevModus;
        }

        countableinput(ctx) {
            if (ctx.primitive.length > 0) {
                this.visit(ctx.primitive)
            } else if (ctx.reporterblock.length > 0) {
                this.visit(ctx.reporterblock)
            }
        }



    }

    // for the playground to work the returned object must contain these fields
    return {
        lexer: MyLexer,
        parser: parser,
        visitor: XMLVisitor
    };
}