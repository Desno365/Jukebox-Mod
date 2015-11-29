/*
This work is licensed under the Creative Commons Attribution- NonCommercial 4.0 International License. To view a copy
of this license, visit http://creativecommons.org/licenses/by-nc/4.0/ or send a letter to Creative Commons, 444 Castro
Street, Suite 900, Mountain View, California, 94041, USA.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/* ******* Jukebox Mod by Desno365 ******* */

// updates variables
const CURRENT_VERSION = "r004";
var latestVersion;

// minecraft variables
const GameMode = {
	SURVIVAL: 0,
	CREATIVE: 1
};

//activity and other Android variables
var currentActivity = com.mojang.minecraftpe.MainActivity.currentMainActivity.get();
var sdcard = android.os.Environment.getExternalStorageDirectory();

//display size and density variables
var metrics = new android.util.DisplayMetrics();
currentActivity.getWindowManager().getDefaultDisplay().getMetrics(metrics);
var deviceDensity = metrics.density;
metrics = null;

//"now playing" message variables
var nowPlayingMessage = "";
var currentColor = 0;

//other variables
const MAX_LOGARITHMIC_VOLUME = 65;
const JUKEBOX_SONGS_PATH = sdcard + "/games/com.mojang/minecraft-jukebox/";
var jukeboxes = [];
var discNames = ["13 Disc", "Cat Disc", "Blocks Disc", "Chirp Disc", "Far Disc", "Mall Disc", "Mellohi Disc", "Stal Disc", "Strad Disc", "Ward Disc", "11 Disc", "Wait Disc"];
var discSongs = ["13.ogg", "cat.ogg", "blocks.ogg", "chirp.ogg", "far.ogg", "mall.ogg", "mellohi.ogg", "stal.ogg", "strad.ogg", "ward.ogg", "11.ogg", "wait.ogg"];


ModPE.setItem(2256, "record_13", 0, "13 Disc", 1);
Item.setCategory(2256, ItemCategory.TOOL);
Player.addItemCreativeInv(2256, 1);

ModPE.setItem(2257, "record_cat", 0, "Cat Disc", 1);
Item.setCategory(2257, ItemCategory.TOOL);
Player.addItemCreativeInv(2257, 1);

ModPE.setItem(2258, "record_blocks", 0, "Blocks Disc", 1);
Item.setCategory(2258, ItemCategory.TOOL);
Player.addItemCreativeInv(2258, 1);

ModPE.setItem(2259, "record_chirp", 0, "Chirp Disc", 1);
Item.setCategory(2259, ItemCategory.TOOL);
Player.addItemCreativeInv(2259, 1);

ModPE.setItem(2260, "record_far", 0, "Far Disc", 1);
Item.setCategory(2260, ItemCategory.TOOL);
Player.addItemCreativeInv(2260, 1);

ModPE.setItem(2261, "record_mall", 0, "Mall Disc", 1);
Item.setCategory(2261, ItemCategory.TOOL);
Player.addItemCreativeInv(2261, 1);

ModPE.setItem(2262, "record_mellohi", 0, "Mellohi Disc", 1);
Item.setCategory(2262, ItemCategory.TOOL);
Player.addItemCreativeInv(2262, 1);

ModPE.setItem(2263, "record_stal", 0, "Stal Disc", 1);
Item.setCategory(2263, ItemCategory.TOOL);
Player.addItemCreativeInv(2263, 1);

ModPE.setItem(2264, "record_strad", 0, "Strad Disc", 1);
Item.setCategory(2264, ItemCategory.TOOL);
Player.addItemCreativeInv(2264, 1);

ModPE.setItem(2265, "record_ward", 0, "Ward Disc", 1);
Item.setCategory(2265, ItemCategory.TOOL);
Player.addItemCreativeInv(2265, 1);

ModPE.setItem(2266, "record_11", 0, "11 Disc", 1);
Item.setCategory(2266, ItemCategory.TOOL);
Player.addItemCreativeInv(2266, 1);

ModPE.setItem(2267, "record_wait", 0, "Wait Disc", 1);
Item.setCategory(2267, ItemCategory.TOOL);
Player.addItemCreativeInv(2267, 1);


const JUKEBOX_ID = 84;
Block.defineBlock(JUKEBOX_ID, "Jukebox", [["jukebox_side", 0], ["jukebox_top", 0], ["jukebox_side", 0], ["jukebox_side", 0], ["jukebox_side", 0], ["jukebox_side", 0]], 17);
Block.setDestroyTime(JUKEBOX_ID, 2);
Block.setExplosionResistance(JUKEBOX_ID, 30);
Item.addShapedRecipe(JUKEBOX_ID, 1, 0, [
	"www",
	"wdw",
	"www"], ["w", 5, 0, "d", 264, 0]);
Item.setCategory(JUKEBOX_ID, ItemCategory.DECORATION);
Player.addItemCreativeInv(JUKEBOX_ID, 1);
	

function selectLevelHook()
{
	currentActivity.runOnUiThread(new java.lang.Runnable()
	{
		run: function()
		{
			try
			{
				var areSoundsMissing = false;
				var missingSoundsText = "";
				var checkSounds = [];
				for(var i = 0; i <= 11; i++)
				{
					checkSounds[i] = new java.io.File(JUKEBOX_SONGS_PATH + discSongs[i]);
					if(!checkSounds[i].exists())
					{
						areSoundsMissing = true;
						missingSoundsText += discSongs[i];
						missingSoundsText += ", ";
					}
				}
				
				if(areSoundsMissing)
					missingSoundsUI(missingSoundsText.substring(0, missingSoundsText.length - 2));
			}catch(err)
			{
				clientMessage("Error: " + err);
			}
		}
	});
}

function newLevel()
{
	new java.lang.Thread(new java.lang.Runnable()
	{
		run: function()
		{
			updateLatestVersionMod();
			if(latestVersion != CURRENT_VERSION && latestVersion != undefined)
				updateAvailableUI();
		}
	}).start();
}

function leaveGame()
{
	for(var i in jukeboxes)
		jukeboxes[i].player.reset();

	jukeboxes = [];

	nowPlayingMessage = "";
	currentColor = 0;
}

function modTick()
{
	// jukebox sound
	for(var i in jukeboxes)
	{
		jukeboxes[i].countdown++;
		if(jukeboxes[i].countdown >= 10)
		{
			jukeboxes[i].countdown = 0;
			var distancePJ = Math.sqrt( (Math.pow(jukeboxes[i].x - Player.getX(), 2)) + (Math.pow(jukeboxes[i].y - Player.getY(), 2)) + (Math.pow(jukeboxes[i].z - Player.getZ(), 2) ));
			if(distancePJ > MAX_LOGARITHMIC_VOLUME)
			{
				jukeboxes[i].player.setVolume(0.0, 0.0);
			}
			else
			{
				var volume = 1 - (Math.log(distancePJ) / Math.log(MAX_LOGARITHMIC_VOLUME));
				jukeboxes[i].player.setVolume(volume, volume);
			}
		}
	}
}

function useItem(x, y, z, itemId, blockId, side, itemDamage)
{
	//is block a jukebox?
	if(blockId == JUKEBOX_ID)
	{
		preventDefault();

		//is block a playing jukebox?
		var checkBlockJukebox = getJukeboxObjectFromXYZ(x, y, z);
		if(checkBlockJukebox != -1)
		{
			checkBlockJukebox.stopJukebox();
			return;
		}

		//is the player carrying a disc?
		if(itemId >= 2256 && itemId <= 2267)
		{
			//jukebox: start playing
			try
			{
				jukeboxes.push(new JukeboxClass(Math.floor(x) + 0.5, Math.floor(y), Math.floor(z) + 0.5, itemId));
				if(Level.getGameMode() == GameMode.SURVIVAL)
					Player.decreaseByOneCarriedItem();
			}
			catch(err)
			{
				ModPE.showTipMessage("Jukebox: Sounds not installed!");
			}
		}
	}
}

function deathHook(murderer, victim)
{
	if(Entity.getEntityTypeId(victim) >= 32 && Entity.getEntityTypeId(victim) <= 39)
	{
		var random = Math.floor((Math.random() * 30) + 365);
		if(random == 365)
		{
			var randomDisc = Math.floor((Math.random() * 12) + 2256);
			Level.dropItem(Entity.getX(victim), Entity.getY(victim), Entity.getZ(victim), 0, randomDisc, 1, 0);
		}
	}
}

function destroyBlock(x, y, z)
{
	var checkBlockJukebox = getJukeboxObjectFromXYZ(x, y, z);
	if(checkBlockJukebox != -1)
		checkBlockJukebox.stopJukebox();
}

//############################################################################
// Added functions (No GUI and No render)
//############################################################################

function JukeboxClass(x, y, z, disc)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.countdown = 0;
	this.disc = disc;

	this.player = new android.media.MediaPlayer();
	this.player.reset();
	this.player.setDataSource(JUKEBOX_SONGS_PATH + getFileNameFromDiscId(disc));
	this.player.prepare();
	this.player.setVolume(1.0, 1.0);
	this.player.setOnCompletionListener(new android.media.MediaPlayer.OnCompletionListener()
	{
		onCompletion: function()
		{
			var jukebox = getJukeboxObjectFromXYZ(x, y, z);
			if(jukebox != -1)
				jukebox.stopJukebox();
		}
	});
	this.player.start();

	nowPlayingMessage = "Now playing: C418 - " + getDiscName(disc);
	currentActivity.runOnUiThread(new java.lang.Runnable(
	{
		run: function()
		{
			for(var ms = 0; ms < 17; ms++) // executed 17 times, 16 different colors, the last one to stop the effect
			{
				if(ms < 16)
				{
					new android.os.Handler().postDelayed(new java.lang.Runnable(
					{
						run: function()
						{
							ModPE.showTipMessage("§" + currentColor.toString(16) + nowPlayingMessage);
							if(currentColor == 15)
								currentColor = 0;
							else
								currentColor++;
						}
					}), ms * 250 + 1);
				} else
				{
					new android.os.Handler().postDelayed(new java.lang.Runnable(
					{
						run: function()
						{
							ModPE.showTipMessage(" ");
							currentColor = 0;
						}
					}), ms * 250 + 1);
				}
			}
		}
	}));


	this.stopJukebox = function()
	{
		this.ejectDisc();
		this.player.reset();
		jukeboxes.splice(jukeboxes.indexOf(this), 1);
	}

	this.ejectDisc = function()
	{
		Level.dropItem(this.x, this.y + 1, this.z, 0, this.disc, 1, 0);
	}
}

function getJukeboxObjectFromXYZ(x, y, z)
{
	for(var i in jukeboxes)
		if(Math.floor(jukeboxes[i].x) == Math.floor(x) && Math.floor(jukeboxes[i].y) == Math.floor(y) && Math.floor(jukeboxes[i].z) == Math.floor(z))
			return jukeboxes[i];
	return -1;
}

function getFileNameFromDiscId(discId)
{
	for(var i in discSongs)
		if(discId - 2256 == i)
			return discSongs[i];
}

function getDiscName(disc)
{
	for(var i in discNames)
		if(disc - 2256 == i)
			return discNames[i];
}

Player.decreaseByOneCarriedItem = function()
{
	if(Player.getCarriedItemCount() == 1)
		Player.clearInventorySlot(Player.getSelectedSlotId());
	else
		Entity.setCarriedItem(Player.getEntity(), Player.getCarriedItem(), Player.getCarriedItemCount() - 1, 0);
}

function updateLatestVersionMod()
{
	try
	{
		// download content
		var url = new java.net.URL("https://raw.githubusercontent.com/Desno365/MCPE-scripts/master/jukeboxMOD-version");
		var connection = url.openConnection();
 
		// get content
		inputStream = connection.getInputStream();
 
		// read result
		var loadedVersion = "";
		var bufferedVersionReader = new java.io.BufferedReader(new java.io.InputStreamReader(inputStream));
		var rowVersion = "";
		while((rowVersion = bufferedVersionReader.readLine()) != null)
		{
			loadedVersion += rowVersion;
		}
		latestVersion = loadedVersion.split(" ")[0];
 
		// close what needs to be closed
		bufferedVersionReader.close();
		inputStream.close();
	} catch(err)
	{
		clientMessage("Jukebox Mod: Can't check for updates, please check your Internet connection.");
		ModPE.log("Jukebox Mod: getLatestVersionMod(): caught an error: " + err);
	}
}

function convertDpToPixel(dp)
{
	//
	return Math.round(dp * deviceDensity);
}

const MARGIN_HORIZONTAL_BIG = 16;
const MARGIN_HORIZONTAL_SMALL = 4;

function setMarginsLinearLayout(view, left, top, right, bottom)
{
	var originalParams = view.getLayoutParams();
	var newParams = new android.widget.LinearLayout.LayoutParams(originalParams);
	newParams.setMargins(convertDpToPixel(left), convertDpToPixel(top), convertDpToPixel(right), convertDpToPixel(bottom));
	view.setLayoutParams(newParams);
}

//############################################################################
// GUI functions
//############################################################################

function missingSoundsUI(soundsText)
{
	currentActivity.runOnUiThread(new java.lang.Runnable()
	{
		run: function()
		{
			try
			{
				var layout = new android.widget.LinearLayout(currentActivity);
				var padding = convertDpToPixel(8);
				layout.setPadding(padding, padding, padding, padding);
				layout.setOrientation(android.widget.LinearLayout.VERTICAL);

				var scroll = new android.widget.ScrollView(currentActivity);
				scroll.addView(layout);
			
				var popup = new android.app.Dialog(currentActivity); 
				popup.setContentView(scroll);
				popup.setTitle(new android.text.Html.fromHtml("Jukebox Mod: ERROR"));
				
				var missingText = new android.widget.TextView(currentActivity);
				missingText.setText(new android.text.Html.fromHtml("<b>Jukebox Mod by Desno365 ERROR</b>: missing sounds.<br> " +
				"These sounds are missing: " + soundsText + ".<br><br>" +
				'<b><i>IMPORTANT</b></i>: you have to place the "minecraft-jukebox" folder (the folder is inside the zip that contains the mod) in "sdcard/games/com.mojang/".'));
				layout.addView(missingText);
				
				var exitButton = new android.widget.Button(currentActivity); 
				exitButton.setText("Close"); 
				exitButton.setOnClickListener(new android.view.View.OnClickListener()
				{
					onClick: function()
					{
						popup.dismiss();
					}
				}); 
				layout.addView(exitButton); 
				

				popup.show();
			
			}catch(err)
			{
				clientMessage("Error: " + err);
			}
		}
	});
}

function updateAvailableUI()
{
	currentActivity.runOnUiThread(new java.lang.Runnable()
	{
		run: function()
		{
			try
			{
				var layout = new android.widget.LinearLayout(currentActivity);
				var padding = convertDpToPixel(8);
				layout.setPadding(padding, padding, padding, padding);
				layout.setOrientation(android.widget.LinearLayout.VERTICAL);

				var scroll = new android.widget.ScrollView(currentActivity);
				scroll.addView(layout);
			
				var popup = new android.app.Dialog(currentActivity); 
				popup.setContentView(scroll);
				popup.setTitle(new android.text.Html.fromHtml("Jukebox Mod: new version"));
				
				var updateText = new android.widget.TextView(currentActivity);
				updateText.setText(new android.text.Html.fromHtml("New version available, you have the " + CURRENT_VERSION + " version and the latest version is " + latestVersion + ".<br>" +
					"You can find a download link on Desno365's website (press the button to visit it)."));
				layout.addView(updateText);
				setMarginsLinearLayout(updateText, 0, MARGIN_HORIZONTAL_SMALL, 0, MARGIN_HORIZONTAL_SMALL);

				var downloadButton = new android.widget.Button(currentActivity); 
				downloadButton.setText("Visit website"); 
				downloadButton.setOnClickListener(new android.view.View.OnClickListener()
				{
					onClick: function()
					{
						var intentBrowser = new android.content.Intent(currentActivity);
						intentBrowser.setAction(android.content.Intent.ACTION_VIEW);
						intentBrowser.setData(android.net.Uri.parse("http://desno365.github.io/minecraft/jukebox-mod/"));
						currentActivity.startActivity(intentBrowser);
						popup.dismiss();
					}
				});
				layout.addView(downloadButton);
				setMarginsLinearLayout(downloadButton, 0, MARGIN_HORIZONTAL_SMALL, 0, MARGIN_HORIZONTAL_BIG);
	
				var exitButton = new android.widget.Button(currentActivity); 
				exitButton.setText("Close"); 
				exitButton.setOnClickListener(new android.view.View.OnClickListener()
				{
					onClick: function()
					{
						popup.dismiss();
					}
				}); 
				layout.addView(exitButton);
				setMarginsLinearLayout(exitButton, 0, MARGIN_HORIZONTAL_SMALL, 0, MARGIN_HORIZONTAL_SMALL);
				

				popup.show();
			
			}catch(err)
			{
				clientMessage("Error: " + err);
			}
		}
	});
}
