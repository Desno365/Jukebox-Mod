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
const CURRENT_VERSION = "r005";
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
const JUKEBOX_SONGS_PATH = sdcard + "/games/com.mojang/jukebox-music/";
var jukeboxes = [];
var discNames = ["13 Disc", "Cat Disc", "Blocks Disc", "Chirp Disc", "Far Disc", "Mall Disc", "Mellohi Disc", "Stal Disc", "Strad Disc", "Ward Disc", "11 Disc", "Wait Disc"];
var discSongs = ["13.mp3", "cat.mp3", "blocks.mp3", "chirp.mp3", "far.mp3", "mall.mp3", "mellohi.mp3", "stal.mp3", "strad.mp3", "ward.mp3", "11.mp3", "wait.mp3"];


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
	// reset jukebox variables
	JukeboxHooks.leaveGame();
}

function modTick()
{
	// set volume of jukeboxes
	JukeboxHooks.modTick();
}

function useItem(x, y, z, itemId, blockId, side, itemDamage, blockDamage)
{
	// use jukebox
	JukeboxHooks.useItem(x, y, z, itemId, blockId);
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

function destroyBlock(x, y, z, side)
{
	// stop jukebox when destroyed
	JukeboxHooks.destroyBlock(x, y, z);
}


//############################################################################
// Added functions (No GUI and No render)
//############################################################################

//########## JUKEBOX functions ##########
function JukeboxPlayerClass(x, y, z, disc)
{
	this.x = x;
	this.y = y;
	this.z = z;
	this.countdown = 0;
	this.disc = disc;

	this.player = new android.media.MediaPlayer();
	this.player.setDataSource(JUKEBOX_SONGS_PATH + getFileNameFromDiscId(disc));
	this.player.setVolume(1.0, 1.0);
	this.player.prepare();
	this.player.setOnCompletionListener(new android.media.MediaPlayer.OnCompletionListener()
	{
		onCompletion: function(mp)
		{
			var jukebox = getJukeboxObjectFromXYZ(x, y, z);
			if(jukebox != -1)
				jukebox.stopJukebox();
		}
	});
	this.player.start();

	// show Now playing message
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

	// set volume of the player based on distance of the player from the jukebox
	this.setVolumeBasedOnDistance = function()
	{
		var distancePlayerJukebox = Math.sqrt( Math.pow(this.x - Player.getX(), 2) + Math.pow(this.y - Player.getY(), 2) + Math.pow(this.z - Player.getZ(), 2) );
		if(distancePlayerJukebox > MAX_LOGARITHMIC_VOLUME)
		{
			this.player.setVolume(0.0, 0.0);
		} else
		{
			var volume = 1 - (Math.log(distancePlayerJukebox) / Math.log(MAX_LOGARITHMIC_VOLUME));
			this.player.setVolume(volume, volume);
		}
	}

	// eject the disc, stop the player and remove the Jukebox object
	this.stopJukebox = function()
	{
		this.player.release();
		this.player = null;
		this.ejectDisc();
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

var JukeboxHooks = {

	leaveGame: function()
	{
		for(var i in jukeboxes)
			jukeboxes[i].player.release();
		jukeboxes = [];
		nowPlayingMessage = "";
		currentColor = 0;
	},

	modTick: function()
	{
		for(var i in jukeboxes)
		{
			jukeboxes[i].countdown++;
			if(jukeboxes[i].countdown >= 10)
			{
				jukeboxes[i].countdown = 0;
				jukeboxes[i].setVolumeBasedOnDistance();
			}
		}
	},

	useItem: function(x, y, z, itemId, blockId)
	{
		// is block a jukebox?
		if(blockId == JUKEBOX_ID)
		{
			preventDefault();

			// is block a playing jukebox?
			var checkBlockJukebox = getJukeboxObjectFromXYZ(x, y, z);
			if(checkBlockJukebox != -1)
			{
				checkBlockJukebox.stopJukebox();
			} else
			{
				// jukebox not playing, is the player carrying a disc?
				if(itemId >= 2256 && itemId <= 2267)
				{
					// jukebox: start playing
					try
					{
						jukeboxes.push(new JukeboxPlayerClass(Math.floor(x) + 0.5, Math.floor(y), Math.floor(z) + 0.5, itemId));
						if(Level.getGameMode() == GameMode.SURVIVAL)
							Player.decreaseByOneCarriedItem();
					}
					catch(err)
					{
						clientMessage("Jukebox: Sounds not installed!");
					}
				}
			}
		}
	},

	destroyBlock: function(x, y, z)
	{
		var checkBlockJukebox = getJukeboxObjectFromXYZ(x, y, z);
		if(checkBlockJukebox != -1)
			checkBlockJukebox.stopJukebox();
	}
};
//########## JUKEBOX functions - END ##########


//########## FILE functions ##########
function deleteFile(path)
{
	var file = new java.io.File(path);

	if(file.isDirectory())
	{
		var directoryFiles = file.listFiles();
		for(var i in directoryFiles)
		{
			deleteFile(directoryFiles[i].getAbsolutePath());
		}
		file.delete();
	}

	if(file.isFile())
		file.delete();
}

function doesFileExist(path)
{
	var file = new java.io.File(path);
	return file.exists();
}

function isFileEmpty(path)
{
	var file = new java.io.File(path);
	if(file.length() > 0)
		return false;
	else
		return true;
}

function writeFileFromByteArray(byteArray, path)
{
	// create file and parent directories
	var file = new java.io.File(path);
	if(file.exists())
		file.delete();
	file.getParentFile().mkdirs();
	file.createNewFile();

	// write to file
	var stream = new java.io.FileOutputStream(file);
	stream.write(byteArray);
	stream.close();

	byteArray = null;
}

function writeFileFromInputStream(inputStream, path)
{
	// create file and parent directories
	var file = new java.io.File(path);
	if(file.exists())
		file.delete();
	file.getParentFile().mkdirs();
	file.createNewFile();

	// write to file
	var outputStream = new java.io.FileOutputStream(file);
	var read = 0;
	var bytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
	while ((read = inputStream.read(bytes)) != -1) {
		outputStream.write(bytes, 0, read);
	}
	outputStream.close();
}
//########## FILE functions - END ##########


//########## MISC functions ##########
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

function getLogText()
{
	//
	return("Jukebox Mod: ");
}

function convertDpToPixel(dp)
{
	//
	return Math.round(dp * deviceDensity);
}

//########## MISC functions - END ##########


//########################################################################################################################################################
// Utils of UI functions
//########################################################################################################################################################

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
// UI functions
//############################################################################

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


//########################################################################################################################################################
// Sounds installation
//########################################################################################################################################################

var SoundsInstaller = {

	sounds:
	{
		version: 1,
		soundArray: [
			// { fileName: "", file: "" },
			// { fileName: "", fileDirectory: "", file: "" },

			{
				fileName: "13.mp3"
			},
			{
				fileName: "cat.mp3"
			},
			{
				fileName: "blocks.mp3"
			},
			{
				fileName: "chirp.mp3"
			},
			{
				fileName: "far.mp3"
			},
			{
				fileName: "mall.mp3"
			},
			{
				fileName: "mellohi.mp3"
			},
			{
				fileName: "stal.mp3"
			},
			{
				fileName: "strad.mp3"
			},
			{
				fileName: "ward.mp3"
			},
			{
				fileName: "11.mp3"
			},
			{
				fileName: "wait.mp3"
			},
		]
	},

	versionFileName: "version.txt",

	pathInSdcard: JUKEBOX_SONGS_PATH,

	pathInTexturePack: "/jukebox-music/",


	checkAtStartup: function()
	{
		ModPE.log(getLogText() + "checkAtStartup(): started check.");

		if(SoundsInstaller.needsInstallation())
		{
			ModPE.log(getLogText() + "checkAtStartup(): sounds NOT correctly installed!");

			SoundsInstaller.install();
		} else
		{
			ModPE.log(getLogText() + "checkAtStartup(): sounds correctly installed.");
		}
	},


	needsInstallation: function()
	{
		if(doesFileExist(SoundsInstaller.pathInSdcard + SoundsInstaller.versionFileName))
		{
			var versionOfSounds = SoundsInstaller.getInstalledVersion();
			ModPE.log(getLogText() + "needsInstallation(): version file found, version: " + versionOfSounds);

			// check version
			if(versionOfSounds == SoundsInstaller.sounds.version)
			{
				ModPE.log(getLogText() + "needsInstallation(): version of the file matches saved version.");
				return !SoundsInstaller.areSoundsPresent();
			} else
			{
				ModPE.log(getLogText() + "needsInstallation(): version of the file is different than saved version.");
				return true;
			}
		} else
		{
			ModPE.log(getLogText() + "needsInstallation(): version file not found.");
			return true;
		}
	},

	getInstalledVersion: function()
	{
		var versionFile = new java.io.File(SoundsInstaller.pathInSdcard + SoundsInstaller.versionFileName);
		if(versionFile.exists())
		{
			var loadedVersion = "";
			var streamVersionInput = new java.io.FileInputStream(versionFile);
			var bufferedVersionReader = new java.io.BufferedReader(new java.io.InputStreamReader(streamVersionInput));
			var rowVersion = "";
			while((rowVersion = bufferedVersionReader.readLine()) != null)
			{
				loadedVersion += rowVersion;
			}
			var loadedVersion = loadedVersion.split(" ");
			bufferedVersionReader.close();

			ModPE.log(getLogText() + "getInstalledVersion(): text on the version file: " + loadedVersion);
			return parseInt(loadedVersion);
		} else
		{
			print("Bug found: remember that getInstalledVersion() should be used only when version file exists.");
			return -1;
		}
	},

	areSoundsPresent: function()
	{
		var arrayOfMissingSounds = SoundsInstaller.checkMissingSounds();

		if(arrayOfMissingSounds.length == 0)
		{
			// yeah, all sounds needed have been found
			ModPE.log(getLogText() + "areSoundsPresent(): all sounds present.");
			return true;
		} else
		{
			// not correctly installed :(
			ModPE.log(getLogText() + "areSoundsPresent(): some sounds are missing.");
			ModPE.log(getLogText() + "areSoundsPresent(): missing: " + arrayOfMissingSounds.toString());
			return false;
		}
	},

	checkMissingSounds: function()
	{
		var arrayOfErrors = [];
		for(var i in SoundsInstaller.sounds.soundArray)
		{
			if(SoundsInstaller.sounds.soundArray[i].fileDirectory == undefined || SoundsInstaller.sounds.soundArray[i].fileDirectory == null)
			{
				// file is inside the general sound folder
				if(!doesFileExist(SoundsInstaller.pathInSdcard + SoundsInstaller.sounds.soundArray[i].fileName))
				{
					if(arrayOfErrors.indexOf(SoundsInstaller.sounds.soundArray[i].fileName) == -1)
						arrayOfErrors.push(SoundsInstaller.sounds.soundArray[i].fileName);
				} else
				{
					// file exists, maybe is empty?
					if(isFileEmpty(SoundsInstaller.pathInSdcard + SoundsInstaller.sounds.soundArray[i].fileName))
					{
						if(arrayOfErrors.indexOf(SoundsInstaller.sounds.soundArray[i].fileName) == -1)
							arrayOfErrors.push(SoundsInstaller.sounds.soundArray[i].fileName);
					}
				}
			} else
			{
				// file is inside another folder
				if(!doesFileExist(SoundsInstaller.pathInSdcard + SoundsInstaller.sounds.soundArray[i].fileDirectory + "/" + SoundsInstaller.sounds.soundArray[i].fileName))
				{
					if(arrayOfErrors.indexOf(SoundsInstaller.sounds.soundArray[i].fileName) == -1)
						arrayOfErrors.push(SoundsInstaller.sounds.soundArray[i].fileName);
				} else
				{
					// file exists, maybe is empty?
					if(isFileEmpty(SoundsInstaller.pathInSdcard + SoundsInstaller.sounds.soundArray[i].fileDirectory + "/" + SoundsInstaller.sounds.soundArray[i].fileName))
					{
						if(arrayOfErrors.indexOf(SoundsInstaller.sounds.soundArray[i].fileName) == -1)
							arrayOfErrors.push(SoundsInstaller.sounds.soundArray[i].fileName);
					}
				}
			}
		}

		return arrayOfErrors;
	},

	install: function()
	{
		new java.lang.Thread(new java.lang.Runnable()
		{
			run: function()
			{
				deleteFile(SoundsInstaller.pathInSdcard); //delete previous files if present

				for(var i in SoundsInstaller.sounds.soundArray)
				{
					// save file on the sdcard
					if(SoundsInstaller.sounds.soundArray[i].fileDirectory == undefined || SoundsInstaller.sounds.soundArray[i].fileDirectory == null)
					{
						// file is inside the general sound folder
						try
						{
							writeFileFromInputStream(ModPE.openInputStreamFromTexturePack(SoundsInstaller.pathInTexturePack + SoundsInstaller.sounds.soundArray[i].fileName), SoundsInstaller.pathInSdcard + SoundsInstaller.sounds.soundArray[i].fileName);
						} catch(e)
						{
							// probably texture pack not installed
							ModPE.log(getLogText() + "error while writing sound to sdcard (1): " + e);
						}
					} else
					{
						// file is inside another folder
						try
						{
							writeFileFromInputStream(ModPE.openInputStreamFromTexturePack(SoundsInstaller.pathInTexturePack + SoundsInstaller.sounds.soundArray[i].fileDirectory + "/" + SoundsInstaller.sounds.soundArray[i].fileName), SoundsInstaller.pathInSdcard + SoundsInstaller.sounds.soundArray[i].fileDirectory + "/" + SoundsInstaller.sounds.soundArray[i].fileName);
						} catch(e)
						{
							// probably texture pack not installed
							ModPE.log(getLogText() + "error while writing sound to sdcard (2): " + e);
						}
					}
				}

				var nomediaFile = new java.io.File(SoundsInstaller.pathInSdcard + ".nomedia");
				if(!nomediaFile.exists())
					nomediaFile.createNewFile();

				// put file version
				SoundsInstaller.saveFileWithVersion();

				// END INSTALLATION
				SoundsInstaller.onFinishInstallation();
			}
		}).start();
	},


	saveFileWithVersion: function()
	{
		var versionSaveFile = new java.io.File(SoundsInstaller.pathInSdcard + SoundsInstaller.versionFileName);
		if(versionSaveFile.exists())
			versionSaveFile.delete();
		versionSaveFile.createNewFile();

		var streamOutputVersion = new java.io.FileOutputStream(versionSaveFile);
		var streamWriterVersion = new java.io.OutputStreamWriter(streamOutputVersion);

		streamWriterVersion.append(SoundsInstaller.sounds.version + "  These sounds are used by the Jukebox Mod, made by Desno365");
		streamWriterVersion.close();
		streamOutputVersion.close();
	},


	onFinishInstallation: function()
	{
		ModPE.log(getLogText() + "Finished sounds installation. Re-checking sounds...");

		var notSuccess = SoundsInstaller.needsInstallation();
		if(notSuccess)
		{
			currentActivity.runOnUiThread(new java.lang.Runnable() {
				run: function() {
					android.widget.Toast.makeText(currentActivity, new android.text.Html.fromHtml("<b>Jukebox</b>: An error has happened during sounds installation of the Jukebox Mod, please check if the mod's Texture Pack is enabled."), android.widget.Toast.LENGTH_LONG).show();
				}
			});
			ModPE.log(getLogText() + "Sounds HAVEN'T been correctly installed!");
		} else
		{
			ModPE.log(getLogText() + "Sounds have been correctly installed. Very good.");
		}
	},
};


//########################################################################################################################################################
// Things to do at startup
//########################################################################################################################################################

// check sounds
currentActivity.runOnUiThread(new java.lang.Runnable(
{
	run: function()
	{
		new android.os.Handler().postDelayed(new java.lang.Runnable(
		{
			run: function()
			{
				SoundsInstaller.checkAtStartup();
			}
		}), 750);
	}
}));

