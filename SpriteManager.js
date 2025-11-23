class SpriteManager {
    constructor() {
        this.spriteSheet = null;
        this.loaded = false;
        this.sprites = {};

        // Define sprite coordinates (x, y, width, height)
        // These are estimated and can be refined
        this.defineSprites();
    }

    defineSprites() {
        // Player Ship Sprites (Row 1, first 2 cells)
        // Ship is HORIZONTAL in sprite sheet (facing right), we rotate it in code
        // Exact coordinates measured using sprite_test.html diagnostic tool
        this.sprites.player_ship = [
            { x: 10, y: 0, w: 100, h: 140 },  // Frame 0: Idle with trail
            { x: 110, y: 0, w: 95, h: 140 }   // Frame 1: Engine thrust with brighter trail
        ];

        // Future sprites can be added here
        // Example:
        // this.sprites.enemy_bat = [
        //     { x: 128, y: 0, w: 64, h: 64 },
        //     { x: 192, y: 0, w: 64, h: 64 },
        // ];
    }

    load(imagePath) {
        return new Promise((resolve, reject) => {
            this.spriteSheet = new Image();

            this.spriteSheet.onload = () => {
                this.loaded = true;
                console.log('✅ Sprite sheet loaded successfully:', imagePath);
                resolve();
            };

            this.spriteSheet.onerror = (error) => {
                console.error('❌ Failed to load sprite sheet:', imagePath, error);
                reject(error);
            };

            this.spriteSheet.src = imagePath;
        });
    }

    /**
     * Draw a single sprite frame
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} spriteName - Name of sprite (e.g., 'player_ship')
     * @param {number} frame - Frame index (0, 1, 2, etc.)
     * @param {number} x - X position on canvas (center)
     * @param {number} y - Y position on canvas (center)
     * @param {number} scale - Scale factor (1.0 = original size)
     * @param {number} rotation - Rotation in radians (optional, default 0)
     */
    drawSprite(ctx, spriteName, frame, x, y, scale = 1.0, rotation = 0) {
        if (!this.loaded) {
            console.warn('Sprite sheet not loaded yet');
            return false;
        }

        const sprite = this.sprites[spriteName];
        if (!sprite) {
            console.warn(`Sprite '${spriteName}' not found`);
            return false;
        }

        const frameData = sprite[frame];
        if (!frameData) {
            console.warn(`Frame ${frame} not found for sprite '${spriteName}'`);
            return false;
        }

        ctx.save();

        // Translate to position
        ctx.translate(x, y);

        // Apply rotation if needed
        if (rotation !== 0) {
            ctx.rotate(rotation);
        }

        // Calculate scaled dimensions
        const scaledWidth = frameData.w * scale;
        const scaledHeight = frameData.h * scale;

        // Draw sprite centered at (x, y)
        ctx.drawImage(
            this.spriteSheet,
            frameData.x, frameData.y, frameData.w, frameData.h,  // Source
            -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight  // Destination (centered)
        );

        ctx.restore();
        return true;
    }

    /**
     * Draw an animated sprite (cycles through frames automatically)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} spriteName - Name of sprite
     * @param {number} animationTimer - Timer value to determine frame
     * @param {number} frameSpeed - Frames per animation cycle (higher = slower)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} scale - Scale factor
     * @param {number} rotation - Rotation in radians (optional)
     */
    drawAnimatedSprite(ctx, spriteName, animationTimer, frameSpeed, x, y, scale = 1.0, rotation = 0) {
        const sprite = this.sprites[spriteName];
        if (!sprite) return false;

        // Calculate current frame based on timer
        const frameCount = sprite.length;
        const currentFrame = Math.floor(animationTimer / frameSpeed) % frameCount;

        return this.drawSprite(ctx, spriteName, currentFrame, x, y, scale, rotation);
    }

    /**
     * Get sprite dimensions (useful for collision detection)
     */
    getSpriteDimensions(spriteName, frame = 0) {
        const sprite = this.sprites[spriteName];
        if (!sprite || !sprite[frame]) return null;

        return {
            width: sprite[frame].w,
            height: sprite[frame].h
        };
    }
}
