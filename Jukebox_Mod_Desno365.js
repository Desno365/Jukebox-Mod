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

//number of jukeboxes variable
var nOfJ = 0;

//"now playing" message variables
var nowPlayingMessageBool = false;
var countdownForNowPlayingMessage = 0;
var timesChanged = 0;
var currentColor = 0;
var nowPlayingMessage = "";

//other variables
const MAX_LOGARITHMIC_VOLUME = 65;
const JUKEBOX_SONGS_PATH = (new android.os.Environment.getExternalStorageDirectory() + "/games/com.mojang/minecraft-jukebox/");
var initCreativeItems = true;
var jukeboxes = [];
var discNames = ["11 Disc", "13 Disc", "Blocks Disc", "Cat Disc", "Chirp Disc", "Far Disc", "Mall Disc", "Mellohi Disc", "Stal Disc", "Strad Disc", "Wait Disc", "Ward Disc"];
var discSongs = ["11.ogg", "13.ogg", "blocks.ogg", "cat.ogg", "chirp.ogg", "far.ogg", "mall.ogg", "mellohi.ogg", "stal.ogg", "strad.ogg", "wait.ogg", "ward.ogg"];
var currentActivity = com.mojang.minecraftpe.MainActivity.currentMainActivity.get();


ModPE.setItem(415, "record_11", 0, "11 Disc", 1);

ModPE.setItem(416, "record_13", 0, "13 Disc", 1);

ModPE.setItem(417, "record_blocks", 0, "Blocks Disc", 1);

ModPE.setItem(418, "record_cat", 0, "Cat Disc", 1);

ModPE.setItem(419, "record_chirp", 0, "Chirp Disc", 1);

ModPE.setItem(420, "record_far", 0, "Far Disc", 1);

ModPE.setItem(421, "record_mall", 0, "Mall Disc", 1);

ModPE.setItem(422, "record_mellohi", 0, "Mellohi Disc", 1);

ModPE.setItem(423, "record_stal", 0, "Stal Disc", 1);

ModPE.setItem(424, "record_strad", 0, "Strad Disc", 1);

ModPE.setItem(425, "record_wait", 0, "Wait Disc", 1);

ModPE.setItem(426, "record_ward", 0, "Ward Disc", 1);

Block.defineBlock(84, "Jukebox", [["jukebox_side", 0], ["jukebox_top", 0], ["jukebox_side", 0], ["jukebox_side", 0], ["jukebox_side", 0], ["jukebox_side", 0]]);
Block.setDestroyTime(84, 2);
Block.setExplosionResistance(84, 30);
Item.addShapedRecipe(84, 1, 0, [
	"www",
	"wdw",
	"www"], ["w", 5, 0, "d", 264, 0]);
	

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
					soundsMissingGUI(missingSoundsText.substring(0, missingSoundsText.length - 2));
			}catch(err)
			{
				clientMessage("Error: " + err);
			}
		}
	});
}

function newLevel()
{
	if(initCreativeItems)
	{
		Player.addItemCreativeInv(84, 1);
		for(var i = 415; i <= 426; i++)
			Player.addItemCreativeInv(i, 1);
		initCreativeItems = false;
	}
}

function leaveGame()
{
	for(var i in jukeboxes)
		jukeboxes[i].player.reset();

	nOfJ = 0;
	jukeboxes = [];

	nowPlayingMessageBool = false;
	countdownForNowPlayingMessage = 0;
	timesChanged = 0;
	currentColor = 0;
	nowPlayingMessage = "";
}

function modTick()
{
	for(var i in jukeboxes)
	{
		jukeboxes[i].countdown++;
		if(jukeboxes[i].countdown == 10)
		{
			jukeboxes[i].countdown = 0;
			var distancePJ = Math.sqrt( (Math.pow(jukeboxes[i].x - Player.getX(), 2)) + (Math.pow(jukeboxes[i].y - Player.getY(), 2)) + (Math.pow(jukeboxes[i].z - Player.getZ(), 2) ));
			if(distancePJ > MAX_LOGARITHMIC_VOLUME)
				jukeboxes[i].player.setVolume(0.0, 0.0);
			else
			{
				var volume = 1 - (Math.log(distancePJ) / Math.log(MAX_LOGARITHMIC_VOLUME));
				jukeboxes[i].player.setVolume(volume, volume);
			}
		}
	}

	if(nowPlayingMessageBool)
	{
		if((countdownForNowPlayingMessage % 5) == 0)
		{
			if(timesChanged == 1)
			{
				ModPE.showTipMessage(" ");
				countdownForNowPlayingMessage = 0;
				timesChanged = 0;
				currentColor = 0;
				nowPlayingMessageBool = false;
			}else
			{
				ModPE.showTipMessage("§" + currentColor.toString(16) + nowPlayingMessage);
				if(currentColor  == 15)
				{
					timesChanged++;
					currentColor = 0;
				}
				else
					currentColor++;
			}
		}
		countdownForNowPlayingMessage++;
	}
}

function useItem(x, y, z, itemId, blockId, side, itemDamage)
{
	//is block a jukebox?
	if(Level.getTile(x, y, z) == 84)
	{
		preventDefault();

		//is block a playing jukebox?
		var checkBlockJukebox = getJukeboxObjectFromXYZ(x, y, z);
		if(checkBlockJukebox != -1)
		{
			checkBlockJukebox.removePlayingJukebox();
			return;
		}

		//is the player carrying a disc?
		var carried = Player.getCarriedItem();
		if(carried >= 415 && carried <= 426)
		{
			//jukebox: start playing
			try
			{
				jukeboxes[nOfJ] = new jukebox(Math.floor(x) + 0.5, Math.floor(y), Math.floor(z) + 0.5, carried);
				nOfJ++;
				if(Player.getCarriedItemCount() == 1)
					Player.clearInventorySlot(Player.getSelectedSlotId());
				else
					Entity.setCarriedItem(Player.getEntity(), carried, Player.getCarriedItemCount() - 1, 0);
			}
			catch(err)
			{
				ModPE.showTipMessage("Jukebox: Sounds not installed!");
			}
		}else
			informationsForJukeboxGUI();
	}
}

function deathHook(murderer, victim)
{
	if(Entity.getEntityTypeId(victim) >= 32 && Entity.getEntityTypeId(victim) <= 39)
	{
		var random = Math.floor((Math.random() * 30) + 365);
		if(random == 365)
		{
			var randomDisc = Math.floor((Math.random() * 12) + 415);
			Level.dropItem(Entity.getX(victim), Entity.getY(victim), Entity.getZ(victim), 0, randomDisc, 1, 0);
		}
	}
}

function destroyBlock(x, y, z)
{
	var checkBlockJukebox = getJukeboxObjectFromXYZ(x, y, z);
	if(checkBlockJukebox != -1)
		checkBlockJukebox.removePlayingJukebox();
}

//############################################################################
// Added functions (No GUI and No render)
//############################################################################

function jukebox(x, y, z, disc)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.countdown = 0;
	this.player = new android.media.MediaPlayer();
	this.disc = disc;
	this.player.reset();
	this.player.setDataSource(JUKEBOX_SONGS_PATH + getDataSourceFromDisc(disc));
	this.player.prepare();
	this.player.setVolume(1.0, 1.0);
	this.player.setOnCompletionListener(new android.media.MediaPlayer.OnCompletionListener()
		{
			onCompletion: function()
			{
				getJukeboxObjectFromXYZ(x, y, z).removePlayingJukebox();
			}
		});
	this.player.start();

	nowPlayingMessageBool = true;
	nowPlayingMessage = "Now playing: " + Item.getDiscName(disc);
	countdownForNowPlayingMessage = 0;


	this.removePlayingJukebox = function()
	{
		this.ejectDisc();
		this.player.reset();
		jukeboxes.splice(jukeboxes.indexOf(this), 1);
		nOfJ--;
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

function getDataSourceFromDisc(disc)
{
	for(var i in discSongs)
		if(disc - 415 == i)
			return discSongs[i];
}

Item.getDiscName = function(disc)
{
	for(var i in discNames)
		if(disc - 415 == i)
			return discNames[i];
}

//############################################################################
// GUI functions
//############################################################################

function informationsForJukeboxGUI()
{
	currentActivity.runOnUiThread(new java.lang.Runnable()
	{
		run: function()
		{
			try
			{
				var layoutInfo = new android.widget.LinearLayout(currentActivity);
				layoutInfo.setOrientation(android.widget.LinearLayout.VERTICAL);

				var scrollInfo = new android.widget.ScrollView(currentActivity);
				scrollInfo.addView(layoutInfo);
			
				var popupInfo = new android.app.Dialog(currentActivity); 
				popupInfo.setContentView(scrollInfo);
				popupInfo.setTitle(new android.text.Html.fromHtml("Jukebox Mod by Desno365"));

				var infoText = new android.widget.TextView(currentActivity);
				infoText.setText(new android.text.Html.fromHtml("Welcome to the Jukebox Mod by Desno365! This mod is a porting of the Jukebox that you can find in Minecraft PC.<br><br>" +
					"<b>Jukebox informations</b>:<br>" +
					"-Tap the jukebox with a disc and it will start playing the choosed song.<br>" +
					"-Greater the distance between you and the Jukebox lower the volume of it.<br>" +
					"-<i>Jukebox ID</i>: 84.<br><br>" +
					"<b>Disc informations</b>:<br>" +
					"-There are twelve different discs with twelve different songs (songs ported from Minecraft PC).<br>" +
					"-There is a random chance of finding a disc every 30 kills of hostile mobs.<br>" +
					"-<i>Discs ID</i>: 415≈426.<br>"));
				layoutInfo.addView(infoText);

				var exitInfoButton = new android.widget.Button(currentActivity); 
				exitInfoButton.setText("Close"); 
				exitInfoButton.setOnClickListener(new android.view.View.OnClickListener()
				{ 
					onClick: function()
					{ 
						popupInfo.dismiss();
					}
				}); 
				layoutInfo.addView(exitInfoButton); 
				

				popupInfo.show();
			
			}catch(err)
			{
				clientMessage("Error: " + err);
				clientMessage("Maybe GUI is not supported for your device. Report this error in the official minecraftforum.net thread, please.");
			}
		}
	});
}

function soundsMissingGUI(soundsText)
{
	currentActivity.runOnUiThread(new java.lang.Runnable()
	{
		run: function()
		{
			try
			{
				var layoutMissing = new android.widget.LinearLayout(currentActivity);
				layoutMissing.setOrientation(android.widget.LinearLayout.VERTICAL);

				var scrollMissing = new android.widget.ScrollView(currentActivity);
				scrollMissing.addView(layoutMissing);
			
				var popupMissing = new android.app.Dialog(currentActivity); 
				popupMissing.setContentView(scrollMissing);
				popupMissing.setTitle(new android.text.Html.fromHtml("Jukebox Mod: ERROR"));
				
				var missingText = new android.widget.TextView(currentActivity);
				missingText.setText(new android.text.Html.fromHtml("<b>ERROR</b>: missing sounds.<br> " +
				"These sounds are missing: " + soundsText + ".<br><br>" +
				'<b><i>IMPORTANT</b></i>: you have to place the "minecraft-jukebox" folder (the folder is inside the zip that contains the mod) in "sdcard/games/com.mojang/".'));
				layoutMissing.addView(missingText);
				
				var exitMissingButton = new android.widget.Button(currentActivity); 
				exitMissingButton.setText("Close"); 
				exitMissingButton.setOnClickListener(new android.view.View.OnClickListener()
				{
					onClick: function()
					{
						popupMissing.dismiss();
					}
				}); 
				layoutMissing.addView(exitMissingButton); 
				

				popupMissing.show();
			
			}catch(err)
			{
				clientMessage("Error: " + err);
				clientMessage("Maybe GUI is not supported for your device. Report this error in the official minecraftforum.net thread, please.");
			}
		}
	});
}
