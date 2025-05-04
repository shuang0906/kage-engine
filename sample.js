// KAGE engine IDS (Ideographic Description Sequences) tool

// IDS operator to KAGE transformation mapping
const IDS_OPERATORS = {
    '⿰': 'left-right',    // Left to right
    '⿱': 'top-bottom',    // Top to bottom
    '⿲': 'left-middle-right', // Left to middle to right
    '⿳': 'top-middle-bottom', // Top to middle to bottom
    '⿴': 'surround',      // Surround
    '⿵': 'surround-top',  // Surround from top
    '⿶': 'surround-bottom', // Surround from bottom
    '⿷': 'surround-left', // Surround from left
    '⿸': 'surround-top-left', // Surround from top-left
    '⿹': 'surround-top-right', // Surround from top-right
    '⿺': 'surround-bottom-left', // Surround from bottom-left
    '⿻': 'overlay'        // Overlay
};

class IDSComposer {
    constructor() {
        this.kage = new Kage();
        this.kage.kUseCurve = false;
        this.polygons = new Polygons();
        this.componentCache = {};
        
        // Add stroke data for common characters
        this.kage.kBuhin.push("u65e5", "1:0:0:0:0:200:200:0:0:0:0:200:200:0:0:0:0:200:200:0:0:0:0:200:200"); // 日
        this.kage.kBuhin.push("u6708", "1:0:0:0:0:200:200:0:0:0:0:200:200:0:0:0:0:200:200"); // 月
    }

    // Parse IDS expression and return components and their relationships
    parseIDS(ids) {
        console.log('Parsing IDS:', ids);
        
        // First, find the operator position
        let operatorPos = -1;
        let operator = null;
        
        for (let i = 0; i < ids.length; i++) {
            const char = ids[i];
            console.log('Checking character:', char, 'at position:', i);
            if (char in IDS_OPERATORS) {
                operatorPos = i;
                operator = char;
                console.log('Found operator:', operator, 'at position:', operatorPos);
                break;
            }
        }
        
        if (operatorPos === -1) {
            throw new Error('No IDS operator found in expression');
        }
        
        // Special handling for ⿰ operator at the start
        if (operator === '⿰' && operatorPos === 0 && ids.length === 3) {
            return [ids[1], operator, ids[2]];
        }
        
        // Split the string into left and right components
        const leftComponent = ids.slice(0, operatorPos);
        const rightComponent = ids.slice(operatorPos + 1);
        
        console.log('Split components:', {
            left: leftComponent,
            operator: operator,
            right: rightComponent
        });
        
        if (!leftComponent || !rightComponent) {
            throw new Error('Missing components in IDS expression. Left: "' + leftComponent + '", Right: "' + rightComponent + '"');
        }
        
        return [leftComponent, operator, rightComponent];
    }

    // Generate SVG path data from polygons
    generateSVGPath(polygons) {
        if (!polygons || !polygons.polygons || polygons.polygons.length === 0) {
            return '';
        }

        let pathData = '';
        for (const polygon of polygons.polygons) {
            if (polygon.length < 2) continue;
            
            // Move to first point
            pathData += `M ${polygon[0][0]} ${polygon[0][1]} `;
            
            // Draw lines to remaining points
            for (let i = 1; i < polygon.length; i++) {
                pathData += `L ${polygon[i][0]} ${polygon[i][1]} `;
            }
            
            // Close the path
            pathData += 'Z ';
        }
        
        return pathData;
    }

    // Get stroke data for a character
    getStrokeData(char) {
        // This is a simplified version - in a real implementation, you would need
        // to look up the actual stroke data for each character
        const strokeData = {
            '日': '99:0:0:100:100:200:200:0:0:100:100:200:200:0:0:100:100:200:200:0:0:100:100:200:200',
            '月': '99:0:0:100:100:200:200:0:0:100:100:200:200:0:0:100:100:200:200'
        };
        return strokeData[char] || '';
    }

    // Apply transformation based on IDS operator
    applyTransformation(operator, component1, component2) {
        console.log('Applying transformation:', {
            operator: operator,
            component1: component1,
            component2: component2
        });

        const polygons1 = new Polygons();
        const polygons2 = new Polygons();
        
        // Get component codes
        const code1 = this.getComponentCode(component1);
        const code2 = this.getComponentCode(component2);
        
        console.log('Component codes:', {
            code1: code1,
            code2: code2
        });
        
        if (!code1 || !code2) {
            throw new Error('Invalid component in transformation');
        }
        
        // Make glyphs with transformations
        this.kage.makeGlyph(polygons1, code1);
        console.log('Polygons1 after makeGlyph:', polygons1);
        
        // Get bounding box of first component
        const box1 = this.kage.getBox(polygons1);
        console.log('Bounding box 1:', box1);
        
        // Apply transformation to second component
        let xOffset = 0;
        let yOffset = 0;
        
        switch(operator) {
            case '⿰': // Left to right
                xOffset = box1[2] - box1[0];
                break;
            case '⿱': // Top to bottom
                yOffset = box1[3] - box1[1];
                break;
            // Add more transformations for other operators
        }
        
        // Create transformation string
        const transform = `translate(${xOffset},${yOffset})`;
        
        // Make second glyph with transformation
        this.kage.makeGlyph(polygons2, code2, transform);
        console.log('Polygons2 after makeGlyph:', polygons2);
        
        // Create canvas and context
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Draw first component
        ctx.fillStyle = "rgb(0, 0, 0)";
        for(let i = 0; i < polygons1.array.length; i++) {
            ctx.beginPath();
            ctx.moveTo(polygons1.array[i].array[0].x, polygons1.array[i].array[0].y);
            for(let j = 1; j < polygons1.array[i].array.length; j++) {
                ctx.lineTo(polygons1.array[i].array[j].x, polygons1.array[i].array[j].y);
            }
            ctx.closePath();
            ctx.fill();
        }
        
        // Draw second component
        for(let i = 0; i < polygons2.array.length; i++) {
            ctx.beginPath();
            ctx.moveTo(polygons2.array[i].array[0].x, polygons2.array[i].array[0].y);
            for(let j = 1; j < polygons2.array[i].array.length; j++) {
                ctx.lineTo(polygons2.array[i].array[j].x, polygons2.array[i].array[j].y);
            }
            ctx.closePath();
            ctx.fill();
        }
        
        // Convert canvas to SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '200');
        svg.setAttribute('viewBox', '0 0 200 200');
        
        // Add canvas image to SVG
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', canvas.toDataURL());
        image.setAttribute('width', '200');
        image.setAttribute('height', '200');
        svg.appendChild(image);
        
        return svg;
    }

    // Convert character to KAGE component code
    getComponentCode(char) {
        // Skip if it's an IDS operator
        if (char in IDS_OPERATORS) {
            return null;
        }

        if (!(char in this.componentCache)) {
            // Convert character to Unicode hex code
            const code = char.charCodeAt(0).toString(16);
            this.componentCache[char] = `u${code}`;
        }
        return this.componentCache[char];
    }

    // Compose glyph from IDS expression
    composeGlyph(ids) {
        console.log('Starting composition for:', ids); // Debug log
        
        const components = this.parseIDS(ids);
        
        if (components.length !== 3) {
            throw new Error('Invalid IDS expression structure');
        }
        
        const [leftComponent, operator, rightComponent] = components;
        
        if (!(operator in IDS_OPERATORS)) {
            throw new Error('Invalid operator: ' + operator);
        }
        
        const result = this.applyTransformation(operator, leftComponent, rightComponent);
        this.polygons = result;
        
        return this.polygons;
    }
}

// Export the class for use in other files
window.IDSComposer = IDSComposer;

