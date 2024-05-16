class SquadToken {
  static SCOPE = "squad-token";
  static FLAG_IS_SQUAD = "is-squad";
  static FLAG_MODIFIED = "token-modified-from";
  static FLAG_BACKGROUND = "background";
  static DEFAULT_BACKGROUND = "/modules/squad-token/assets/background.png";

  // Toggle(actors: []Actor) toggles the texture modification effect for tokens associated to the actor
  static Toggle(actors) {
    actors.forEach((actor) => {
      actor.setFlag(
        SquadToken.SCOPE,
        SquadToken.FLAG_IS_SQUAD,
        !actor.getFlag(SquadToken.SCOPE, SquadToken.FLAG_IS_SQUAD),
      );
    });
  }

  // SelectBackground(initialPath: string) launches a file picker to select a background frame for squad-tokens
  static async SelectBackground(initialPath = "") {
    let fp = new FilePicker();
    fp.type = "image";
    if (initialPath !== "") {
      fp.browse(initialPath);
    }
    fp.callback = (path) => {
      SquadToken.SetBackground(path);
    };
    fp.render();
  }

  // SetBackground(path: string) sets the background frame image to use path.
  static SetBackground(path) {
    game.settings.set(SquadToken.SCOPE, SquadToken.FLAG_BACKGROUND, path);
    canvas.tokens.objects.children.forEach((token) => {
      SquadToken._resetToken(token);
      token.refresh();
    });
  }

  // _onSetup() initializes setting storage
  static _onSetup() {
    game.settings.register(SquadToken.SCOPE, SquadToken.FLAG_BACKGROUND, {
      name: "Squad Token Background",
      hint: "Image to use as a frame/background",
      scope: "world",
      config: false,
      requiresReload: false,
      type: String,
      default: SquadToken.DEFAULT_BACKGROUND,
    });
  }

  // _onRefreshToken(token: Token) updates tokens that have been enabled via Toggle()
  static async _onRefreshToken(token) {
    const texture = token.mesh.texture;

    //Check data flags
    const isSquad =
      token.actor.getFlag(SquadToken.SCOPE, SquadToken.FLAG_IS_SQUAD) === true;
    const isModified =
      texture[`_${SquadToken.SCOPE}_${SquadToken.FLAG_MODIFIED}`] !== undefined;
    const background_path = game.settings.get(
      SquadToken.SCOPE,
      SquadToken.FLAG_BACKGROUND,
    );

    //Clear modification if no longer squad
    if (!isSquad && isModified) {
      SquadToken._resetToken(token);
    }

    //Exit if not squad, or allready modified
    if (!isSquad || isModified) {
      return;
    }

    //Create compound sprite
    const container = new PIXI.Container();
    var background = await loadTexture(background_path);
    const size = Math.max(texture.width, texture.height);
    const widthOffset = (size - texture.width) / 2;
    const heightOffset = (size - texture.height) / 2;
    const bg = new PIXI.Sprite(background);
    bg.width = size * 3.5;
    bg.height = size * 3.5;
    bg.zindex = -1;
    container.addChild(bg);
    const sprite1 = new PIXI.Sprite(texture);
    sprite1.x = size / 2 + widthOffset;
    sprite1.y = size / 2 + heightOffset;
    container.addChild(sprite1);
    const sprite2 = new PIXI.Sprite(texture);
    sprite2.x = size * 2 + widthOffset;
    sprite2.y = size / 2 + heightOffset;
    container.addChild(sprite2);
    const sprite3 = new PIXI.Sprite(texture);
    sprite3.x = size / 2 + widthOffset;
    sprite3.y = size * 2 + heightOffset;
    container.addChild(sprite3);
    const sprite4 = new PIXI.Sprite(texture);
    sprite4.x = size * 2 + widthOffset;
    sprite4.y = size * 2 + heightOffset;
    container.addChild(sprite4);

    //Generate new texure
    const compiled = canvas.app.renderer.generateTexture(container);
    compiled[`_${SquadToken.SCOPE}_${SquadToken.FLAG_MODIFIED}`] = texture;

    //Overide existing texture
    token.mesh.texture = compiled;
    token.mesh.refresh();
  }

  static _resetToken(token) {
    const modifiedFrom =
      token.mesh.texture[`_${SquadToken.SCOPE}_${SquadToken.FLAG_MODIFIED}`];
    if (modifiedFrom != undefined) {
      token.mesh.texture = modifiedFrom;
      token.mesh.refresh();
    }
  }
}

globalThis.SquadToken = SquadToken;
Hooks.on("refreshToken", SquadToken._onRefreshToken);
Hooks.on("setup", SquadToken._onSetup);
